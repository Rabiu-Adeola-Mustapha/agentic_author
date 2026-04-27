import { BaseAgent, Tool } from './base-agent';
import { AgentInput, AgentResult, PromptData } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { sanitizePrompt } from '@/lib/guardrails/input-sanitizer';
import {
  validateAgentOutput,
  PromptDataSchema,
} from '@/lib/guardrails/output-validator';

interface PromptWriterInput extends AgentInput {
  rawInput: string;
}

export class PromptWriter extends BaseAgent<PromptWriterInput, PromptData> {
  readonly name = 'PromptWriter';
  readonly instructions = `You are a prompt engineering expert. Your task is to analyze raw user input and convert it into a structured, optimized prompt for content generation.
Extract the following information from the user's input:
1. Topic/Main Subject
2. Target Audience
3. Desired Tone/Style
4. Length Requirements
5. Key Requirements or Constraints

Then, rewrite the prompt to be clear, detailed, and optimized for the AI content generation pipeline.

Return ONLY valid JSON with this structure:
{
  "rawInput": "the original input",
  "structuredIntent": {
    "topic": "...",
    "audience": "...",
    "tone": "...",
    "length": "...",
    "requirements": "..."
  },
  "finalPrompt": "The optimized, detailed prompt for generation"
}`;

  readonly tools: Tool[] = [];

  async run(input: PromptWriterInput): Promise<AgentResult<PromptData>> {
    try {
      const categoryContext = this.buildCategoryContext(input.category);
      const sanitized = sanitizePrompt(input.rawInput);

      const systemPrompt = `You are a prompt engineering expert. Your task is to analyze raw user input and convert it into a structured, optimized prompt for content generation.

${categoryContext}

Extract the following information from the user's input:
1. Topic/Main Subject
2. Target Audience
3. Desired Tone/Style
4. Length Requirements
5. Key Requirements or Constraints

Then, rewrite the prompt to be clear, detailed, and optimized for the AI content generation pipeline.

Return ONLY valid JSON matching this structure exactly:
{
  "rawInput": "the original input",
  "structuredIntent": {
    "topic": "...",
    "audience": "...",
    "tone": "...",
    "length": "...",
    "requirements": "..."
  },
  "finalPrompt": "The optimized, detailed prompt for generation"
}`;

      const { text, usage } = await this.callLLM(systemPrompt, sanitized, []);

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON found in response');
          }
          parsed = JSON.parse(jsonMatch[0]);
        } catch (inner) {
          return {
            success: false,
            error: `Failed to parse LLM response: ${(inner as Error).message}`,
            tokensUsed: usage.totalTokens,
          };
        }
      }

      const validated = validateAgentOutput(
        parsed as PromptData,
        PromptDataSchema
      ) as PromptData;

      await connectDB();
      const prompt = await PromptModel.create({
        projectId: input.projectId,
        userId: input.userId,
        rawInput: input.rawInput,
        structuredIntent: validated.structuredIntent,
        finalPrompt: validated.finalPrompt,
        versions: [],
      });

      await ProjectModel.updateOne(
        { _id: input.projectId },
        { promptId: prompt._id, currentStage: 'plan' }
      );

      return {
        success: true,
        data: validated,
        tokensUsed: usage.totalTokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
      };
    }
  }
}
