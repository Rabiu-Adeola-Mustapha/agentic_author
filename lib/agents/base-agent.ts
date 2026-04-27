import { OpenAI } from 'openai';
import { AgentInput, AgentResult, ContentCategory, PipelineStage } from '@/types';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { z } from 'zod';
import { validateAgentOutput, AgentValidationError } from '@/lib/guardrails/output-validator';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'X-Title': 'Agentic Author',
  },
});

export abstract class BaseAgent<TInput extends AgentInput, TOutput> {
  abstract readonly name: string;
  /** Each agent declares its specific OpenRouter model string */
  protected abstract readonly model: string;

  abstract run(input: TInput): Promise<AgentResult<TOutput>>;
  
  abstract buildSystemMessage(...args: any[]): string;

  protected buildCategoryContext(category: ContentCategory): string {
    const config = CATEGORY_CONFIG[category];
    return [
      `Content Category: ${config.label}`,
      `Writing Style: ${config.writingStyle}`,
      `Research Depth: ${config.researchDepth}`,
      `Citation Required: ${config.citationRequired}`,
      `Structure: ${config.planStructure.join(', ')}`,
    ].join('\n');
  }

  protected async updateProjectStage(projectId: string, stage: PipelineStage): Promise<void> {
    await connectDB();
    await ProjectModel.updateOne({ _id: projectId }, { currentStage: stage });
  }

  protected async callLLM(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ text: string; usage: { totalTokens: number } }> {
    const response = await openrouter.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      usage: {
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  protected parseJsonResponse<T>(rawText: string, schema: z.ZodSchema<T>): T {
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1];
      }
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanText);
    } catch (error) {
      throw new AgentValidationError(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return validateAgentOutput(parsed, schema);
  }
}
