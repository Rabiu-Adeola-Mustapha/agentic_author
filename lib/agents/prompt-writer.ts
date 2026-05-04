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
  The model is an expert prompt engineer and content strategist with deep expertise in the given content category.
 Its job is to analyse a user's rough idea and produce maximum clarity and structure from it.
  It does not generate content — it generates the precise instructions that will guide content generation.

PRIMARY TASK:
Read the raw user input carefully. The input may be vague, short, or poorly structured.
 Identify the core intent and make intelligent inferences for anything left unstated using the conventions of the given content category.

Your primary objective is to rewrite the user's rough idea into a highly optimized generation prompt. This generated prompt MUST be structured with the following 5 explicit headings to ensure it is actionable:

1. [ROLE]: Define a highly specific persona the AI should adopt. Don't just say "expert"; give it a background (e.g., "A veteran political analyst with 20 years of experience covering West African geopolitics and a PhD in Sociology").
2. [CONTEXT]: Provide the "why" and "for whom". Explain the historical background, the specific target audience's demographics and psychology, and the ultimate purpose of the content.
3. [TASK]: Clearly state the exact "what". Describe the primary objective, the core message, and the specific sections or components that must be included.
4. [CONSTRAINTS]: List the non-negotiables. Include tone (e.g., "witty yet authoritative"), length, forbidden topics, formatting rules (e.g., "standard Markdown with H1-H3 headings"), and any specific keywords to include.
5. [OUTPUT FORMAT]: Define the final structure. Describe how the information should be organized (e.g., "A 5-part essay with an engaging hook, three analytical body paragraphs, and a reflective conclusion").

OUTPUT CONTRACT:
The model must respond with a valid JSON object and nothing else. No preamble, no explanation, no markdown formatting outside the JSON itself. The JSON object must have exactly two keys:
- structuredIntent: an object with five fields: topic (a single clear sentence stating the exact subject matter), audience (a specific description of the intended reader or viewer), tone (the voice and register appropriate for this content), length (a realistic word or page count target stated as a range), keyRequirements (an array of 4-7 specific requirements drawn from the user's input and supplemented with sensible category defaults).
- finalPrompt: a SINGLE PLAIN STRING of 300-500 words. It is NOT a nested object. It MUST embed the 5 sections inline as labeled headings within the string itself, like this:
  "[ROLE] You are a veteran cultural journalist... [CONTEXT] This article is for... [TASK] Write a 1000-word article that... [CONSTRAINTS] Tone: witty yet insightful. Do not... [OUTPUT FORMAT] Structure the content as..."
  The entire finalPrompt value must be one continuous string. Do not create sub-keys for ROLE, CONTEXT, etc.

QUALITY STANDARDS:
The structuredIntent must reflect genuine analysis of the input, not a paraphrase. The finalPrompt must be substantially more useful than the user's original input. If the user submitted fewer than 30 words, make explicit reasonable assumptions based on category conventions and state them clearly within the finalPrompt. The keyRequirements array must contain requirements that are specific enough to be verifiable.

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
For thesis and journal: the finalPrompt must name the expected reference style (APA 7th edition by default), specify the research methodology approach if discernible from the input, and identify the central research question or hypothesis the document must answer.
For book and screenplay: the finalPrompt must address the central conflict, the protagonist's goal, and the intended emotional experience for the audience. For screenplays, it must specify the approximate page count and whether it is a feature film, short film, or TV pilot.
For educational: the finalPrompt must specify the education level of the target learner, the pedagogical approach, and at least three measurable learning outcomes the content must enable.

FORBIDDEN BEHAVIOURS:
Do not include any commentary, apology, or explanation outside the JSON object. Do not return a finalPrompt that is a simple copy or minor rewording of the raw input. Do not invent citation requirements for non-academic categories. Do not produce keyRequirements that are vague or unmeasurable. Do not start the finalPrompt with "Write a..." — instead write it as a description of what the content must be and achieve.`;
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
          userPrompt = `PREVIOUS PROMPT:\n${existingPrompt.finalPrompt}\n\nUSER FEEDBACK:\n${input.feedback}\n\nINSTRUCTION: Refine the previous prompt based on the user's feedback. Ensure it still meets all quality standards.`;
        }
      }

      let result = await this.callLLM(systemMessage, userPrompt);
      let totalTokens = result.usage.totalTokens;
      
      let parsed: PromptData;
      try {
        parsed = this.parseJsonResponse(result.text, promptOutputSchema) as unknown as PromptData;
      } catch (error) {
        userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact keys structuredIntent and finalPrompt. finalPrompt MUST be a single plain string, NOT a nested object. No other text.";
        result = await this.callLLM(systemMessage, userPrompt);
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
