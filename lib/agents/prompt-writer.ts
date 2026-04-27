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
}

export class PromptWriter extends BaseAgent<PromptWriterInput, PromptData> {
  readonly name = 'PromptWriter';
  protected readonly model = MODELS.PROMPT_WRITER;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
The model is an expert prompt engineer and content strategist with deep expertise in the given content category. Its job is to analyse a user's rough idea and produce maximum clarity and structure from it. It does not generate content — it generates the precise instructions that will guide content generation.

PRIMARY TASK:
Read the raw user input carefully. The input may be vague, short, or poorly structured. Identify what the user actually wants to create, who the intended audience is, what tone and register is appropriate, approximately how long the content should be, and what the critical requirements are. Make intelligent inferences for anything left unstated using the conventions of the content category. Then rewrite the user's rough idea as a detailed, optimised generation prompt that a skilled writer could follow without needing clarification.

OUTPUT CONTRACT:
The model must respond with a valid JSON object and nothing else. No preamble, no explanation, no markdown formatting outside the JSON itself. The JSON object must have exactly two keys:
- structuredIntent: an object with five fields: topic (a single clear sentence stating the exact subject matter), audience (a specific description of the intended reader or viewer), tone (the voice and register appropriate for this content), length (a realistic word or page count target stated as a range), keyRequirements (an array of 4-7 specific requirements drawn from the user's input and supplemented with sensible category defaults).
- finalPrompt: a single continuous prose paragraph of 200-400 words written as a direct instruction to a skilled human writer. The final prompt must be specific, actionable, and comprehensive. It must reference the topic, audience, tone, length, and all key requirements. It must add value beyond what the user wrote.

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
      const systemMessage = this.buildSystemMessage(project.category);

      let userPrompt = sanitized;
      let result = await this.callLLM(systemMessage, userPrompt);
      let totalTokens = result.usage.totalTokens;
      
      let parsed: PromptData;
      try {
        parsed = this.parseJsonResponse(result.text, promptOutputSchema) as unknown as PromptData;
      } catch (error) {
        userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact keys structuredIntent and finalPrompt. No other text.";
        result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, promptOutputSchema) as unknown as PromptData;
      }

      const prompt = await PromptModel.create({
        projectId: input.projectId,
        userId: input.userId,
        rawInput: input.rawInput, // original unsanitized to store? Instructions: Save a new Prompt document with rawInput
        structuredIntent: parsed.structuredIntent,
        finalPrompt: parsed.finalPrompt,
      });

      project.promptId = prompt._id;
      await project.save();

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
