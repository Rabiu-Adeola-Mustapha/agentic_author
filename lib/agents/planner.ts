import { BaseAgent, Tool } from './base-agent';
import { AgentInput, AgentResult, PlanData } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import {
  validateAgentOutput,
  PlanDataSchema,
} from '@/lib/guardrails/output-validator';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';

interface PlannerInput extends AgentInput {
  promptId: string;
}

export class Planner extends BaseAgent<PlannerInput, PlanData> {
  readonly name = 'Planner';
  readonly instructions = `You are a content structure expert. Your task is to create a detailed content plan based on the final prompt.
Create a comprehensive plan that includes:
1. Content organization by section
2. Formatting rules for each section
3. Overall content strategy and approach
4. Key points to cover in each section

Return ONLY valid JSON with the required structure containing contentType, structure, formattingRules, and contentStrategy.`;

  readonly tools: Tool[] = [];

  async run(input: PlannerInput): Promise<AgentResult<PlanData>> {
    try {
      await connectDB();

      const prompt = await PromptModel.findById(input.promptId);
      if (!prompt) {
        return {
          success: false,
          error: 'Prompt not found',
        };
      }

      const config = CATEGORY_CONFIG[input.category];
      const categoryContext = this.buildCategoryContext(input.category);

      const structureInstructions = config.citationRequired
        ? `For each section, add placeholders for citations like [1], [2], etc. and note that a References section should be included.`
        : '';

      const systemPrompt = `You are a content structure expert. Your task is to create a detailed content plan based on the final prompt.

${categoryContext}

${structureInstructions}

The content must follow this structure: ${config.planStructure.join(', ')}

Create a comprehensive plan that includes:
1. Content organization by section
2. Formatting rules for each section
3. Overall content strategy and approach
4. Key points to cover in each section

Return ONLY valid JSON matching this structure exactly:
{
  "contentType": "the type of content",
  "structure": ["section1", "section2", ...],
  "formattingRules": {
    "section1": "formatting rule",
    "section2": "formatting rule",
    ...
  },
  "contentStrategy": "Overall strategy and approach"
}`;

      const { text, usage } = await this.callLLM(
        systemPrompt,
        prompt.finalPrompt,
        []
      );

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
        parsed as PlanData,
        PlanDataSchema
      ) as PlanData;

      const plan = await PlanModel.create({
        projectId: input.projectId,
        promptId: input.promptId,
        contentType: validated.contentType,
        structure: validated.structure,
        formattingRules: validated.formattingRules,
        contentStrategy: validated.contentStrategy,
      });

      await ProjectModel.updateOne(
        { _id: input.projectId },
        { planId: plan._id, currentStage: 'research' }
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
