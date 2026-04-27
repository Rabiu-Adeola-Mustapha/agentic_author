import { BaseAgent, Tool } from './base-agent';
import { AgentInput, AgentResult, EvaluationData } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { OutputModel } from '@/lib/db/models/Output';
import { EvaluationModel } from '@/lib/db/models/Evaluation';
import {
  validateAgentOutput,
  EvaluationDataSchema,
} from '@/lib/guardrails/output-validator';

interface EvaluatorInput extends AgentInput {
  outputId: string;
}

export class Evaluator extends BaseAgent<EvaluatorInput, EvaluationData> {
  readonly name = 'Evaluator';
  readonly instructions = `You are a professional content evaluator. Your task is to evaluate generated content on multiple dimensions.
Evaluate the content on:
1. Alignment Score (0-100): How well does the content match the original prompt and intent?
2. Quality Score (0-100): How well-written, coherent, and professional is the content?
3. Overall Score (0-100): Average of alignment and quality

Also identify top issues and suggestions for improvement.
Return ONLY valid JSON with the required evaluation structure.`;

  readonly tools: Tool[] = [];

  async run(input: EvaluatorInput): Promise<AgentResult<EvaluationData>> {
    try {
      await connectDB();

      const output = await OutputModel.findById(input.outputId);
      if (!output) {
        return { success: false, error: 'Output not found' };
      }

      const prompt = await PromptModel.findById(
        (await ProjectModel.findById(input.projectId))?.promptId
      );
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const evaluationPrompt = `You are a professional content evaluator. Evaluate this generated content on three dimensions:

1. Alignment Score (0-100): How well does the content match the original prompt and intent?
2. Quality Score (0-100): How well-written, coherent, and professional is the content?
3. Overall Score (0-100): Average of alignment and quality

Also identify:
- Top 3 issues or weaknesses (if any)
- Top 3 suggestions for improvement

Return ONLY valid JSON matching this structure exactly:
{
  "score": <overall_score>,
  "alignmentScore": <alignment_score>,
  "qualityScore": <quality_score>,
  "issues": ["issue1", "issue2", "issue3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const contentPreview = output.content.slice(0, 3000);

      const evaluationSystemPrompt = `You are an expert content evaluator for AI-generated content. Evaluate based on accuracy, clarity, structure, and alignment with requirements.`;

      const result = await this.callLLM(
        evaluationSystemPrompt,
        `Original Intent: ${prompt.finalPrompt}

Generated Content (first 3000 chars):
${contentPreview}

${evaluationPrompt}`,
        []
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(result.text);
      } catch {
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON found in response');
          }
          parsed = JSON.parse(jsonMatch[0]);
        } catch (inner) {
          return {
            success: false,
            error: `Failed to parse evaluation: ${(inner as Error).message}`,
            tokensUsed: result.usage.totalTokens,
          };
        }
      }

      const validated = validateAgentOutput(parsed as EvaluationData, EvaluationDataSchema);

      const evaluation = await EvaluationModel.create({
        outputId: input.outputId,
        projectId: input.projectId,
        score: validated.score,
        alignmentScore: validated.alignmentScore,
        qualityScore: validated.qualityScore,
        issues: validated.issues,
        suggestions: validated.suggestions,
      });

      await ProjectModel.updateOne(
        { _id: input.projectId },
        {
          evaluationId: evaluation._id,
          currentStage: 'done',
          status: 'completed',
        }
      );

      return {
        success: true,
        data: validated,
        tokensUsed: result.usage.totalTokens,
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
