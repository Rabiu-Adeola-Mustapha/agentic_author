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
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  } else {
    const messages = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new AgentValidationError(`Output validation failed: ${messages}`);
  }
}

export const promptOutputSchema = z.object({
  rawInput: z.string(),
  structuredIntent: z.record(z.string(), z.string()),
  finalPrompt: z.string(),
});

export const planOutputSchema = z.object({
  contentType: z.string(),
  structure: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      estimatedWords: z.number(),
    })
  ),
  formattingRules: z.record(z.string(), z.string()),
  contentStrategy: z.string(),
  searchQueries: z.array(z.string()),
});

export const researchOutputSchema = z.object({
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })
  ).optional(), // Assuming sources are handled outside of the agent's exact JSON, the instruction says: "The object must have one key: keyInsights"
  keyInsights: z.array(z.string()),
});

export const outputDataSchema = z.object({
  content: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
  wordCount: z.number(),
});

export const evaluationOutputSchema = z.object({
  score: z.number().min(0).max(100),
  alignmentScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  passedThreshold: z.boolean().optional(),
});
