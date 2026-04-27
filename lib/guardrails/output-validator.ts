import { z } from 'zod';

export class AgentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentValidationError';
  }
}

export function validateAgentOutput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new AgentValidationError(`Output validation failed: ${messages}`);
    }
    throw new AgentValidationError('Unknown validation error');
  }
}

export const PromptDataSchema = z.object({
  rawInput: z.string(),
  structuredIntent: z.record(z.string()),
  finalPrompt: z.string(),
});

export const PlanDataSchema = z.object({
  contentType: z.string(),
  structure: z.array(z.string()),
  formattingRules: z.record(z.string()),
  contentStrategy: z.string(),
});

export const ResearchDataSchema = z.object({
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })
  ),
  keyInsights: z.array(z.string()),
});

export const OutputDataSchema = z.object({
  content: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
  wordCount: z.number(),
});

export const EvaluationDataSchema = z.object({
  score: z.number().min(0).max(100),
  alignmentScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});
