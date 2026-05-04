import mongoose from 'mongoose';
import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, PromptData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { sanitizePrompt } from '@/lib/guardrails/input-sanitizer';
import { promptOutputSchema } from '@/lib/guardrails/output-validator';
import { MODELS } from '@/lib/config/models';

interface PromptWriterInput extends AgentInput {
  rawInput: string;
  feedback?: string;
}

export class PromptWriter extends BaseAgent<PromptWriterInput, PromptData> {
  readonly name = 'PromptWriter';
  protected readonly model = MODELS.PROMPT_WRITER;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
  The model is an expert prompt engineer and content strategist.
  Its job is to analyse a user's rough idea and produce maximum clarity and structure from it.
  It does not generate content — it generates the precise instructions that will guide content generation.

PRIMARY TASK:
Rewrite the user's rough idea into a highly optimized generation prompt. This generated prompt MUST be structured with exactly 5 explicit headings:

1. [ROLE]: Define a highly specific persona and give them an excellent, world-class portfolio of past achievements to elevate their authority (unless the user specifies otherwise). (e.g. "A veteran political analyst whose work has been featured in The Economist...").
2. [CONTEXT]: Provide the "why" and "for whom". Explain the target audience demographics and the ultimate purpose.
3. [TASK]: Clearly state the exact objective, core message, and specific components to include.
4. [CONSTRAINTS]: List non-negotiables (tone, length, forbidden topics, formatting rules).
5. [OUTPUT FORMAT]: Define the final structure. Describe how the final information should be organized.

EXAMPLE OF A GOOD finalPrompt:
"[ROLE] You are a veteran luxury travel journalist specializing in African destinations. [CONTEXT] This article is for C-suite executives aged 30-50 who value exclusivity and authentic experiences over mass tourism. [TASK] Write a 600-word editorial highlighting 3 hidden gem destinations in Rwanda and Namibia. [CONSTRAINTS] Tone: Sophisticated yet adventurous. Use British English. Maximum 3 adjectives per sentence. [OUTPUT FORMAT] Structure: Captivating headline, 100-word intro, 3 themed sections with subheadings, 50-word call-to-action."

OUTPUT CONTRACT:
The model must respond with a valid JSON object:
{
  "structuredIntent": { 
    "topic": "clear subject", 
    "audience": "who it is for", 
    "tone": "voice/style", 
    "length": "e.g. 500-700 words", 
    "keyRequirements": ["req 1", "req 2", ...] 
  },
  "finalPrompt": "ONE CONTINUOUS STRING EMBEDDING THE 5 HEADINGS"
}

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}

FORBIDDEN BEHAVIOURS:
- NEVER start the finalPrompt with "Write a...".
- NEVER omit any of the 5 headings ([ROLE], [CONTEXT], [TASK], [CONSTRAINTS], [OUTPUT FORMAT]).
- NEVER return finalPrompt as an object; it MUST be a single string.
- NEVER include any text outside the JSON object.`;
  }

  async run(input: PromptWriterInput): Promise<AgentResult<PromptData>> {
    try {
      await this.updateProjectStage(input.projectId, 'prompt');
      await connectDB();
      const project = await ProjectModel.findById(input.projectId);
      if (!project) throw new Error('Project not found');

      const sanitized = sanitizePrompt(input.rawInput);
      if (!sanitized || sanitized.trim().length === 0) {
        throw new Error('Input prompt is empty after sanitization');
      }

      const systemMessage = this.buildSystemMessage(project.category);

      let userPrompt = sanitized;

      if (input.feedback && project.promptId) {
        const existingPrompt = await PromptModel.findById(project.promptId);
        if (existingPrompt) {
          userPrompt = `PREVIOUS PROMPT:\n${existingPrompt.finalPrompt}\n\nUSER FEEDBACK:\n${input.feedback}\n\nINSTRUCTION: Refine the previous prompt based on the user's feedback. Ensure it still meets all quality standards and uses the [ROLE], [CONTEXT], [TASK], [CONSTRAINTS], [OUTPUT FORMAT] structure.`;
        }
      }

      // LOWER TEMPERATURE for strict instruction following
      let result = await this.callLLM(systemMessage, userPrompt, { temperature: 0.3 });
      let totalTokens = result.usage.totalTokens;
      
      let parsed: PromptData;
      try {
        parsed = this.parseJsonResponse(result.text, promptOutputSchema) as unknown as PromptData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        userPrompt += `\nYour previous response failed validation: ${errorMessage}\nReturn only a valid JSON object. finalPrompt MUST be a single string containing EXACTLY these 5 headings: [ROLE], [CONTEXT], [TASK], [CONSTRAINTS], [OUTPUT FORMAT].`;
        result = await this.callLLM(systemMessage, userPrompt, { temperature: 0.1 });
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, promptOutputSchema) as unknown as PromptData;
      }

      if (project.promptId) {
        // Update existing prompt document
        const existingPrompt = await PromptModel.findById(project.promptId);
        if (existingPrompt) {
          // If the versions array is empty, push the current finalPrompt as the first version
          if (!existingPrompt.versions || existingPrompt.versions.length === 0) {
            existingPrompt.versions = [{ prompt: existingPrompt.finalPrompt, editedAt: new Date() }];
          }
          // Push the new version
          existingPrompt.versions.push({ prompt: parsed.finalPrompt, editedAt: new Date() });
          
          existingPrompt.finalPrompt = parsed.finalPrompt;
          if (parsed.structuredIntent) {
            existingPrompt.structuredIntent = parsed.structuredIntent;
          }
          await existingPrompt.save();
        }
      } else {
        // Create new prompt document
        const prompt = await PromptModel.create({
          projectId: input.projectId,
          userId: input.userId,
          rawInput: input.rawInput,
          structuredIntent: parsed.structuredIntent,
          finalPrompt: parsed.finalPrompt,
          versions: [{ prompt: parsed.finalPrompt, editedAt: new Date() }]
        });
        project.promptId = prompt._id as mongoose.Types.ObjectId;
        await project.save();
      }

      return {
        success: true,
        data: parsed,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
