import { OpenAI } from 'openai';
import { AgentInput, AgentResult, ContentCategory } from '@/types';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'X-Title': 'Agentic Author',
  },
});

export interface Tool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (...args: unknown[]) => Promise<string>;
}

export abstract class BaseAgent<
  TInput extends AgentInput,
  TOutput,
> {
  abstract readonly name: string;
  abstract readonly instructions: string;
  abstract readonly tools: Tool[];
  protected readonly model = 'grok-2';

  abstract run(input: TInput): Promise<AgentResult<TOutput>>;

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

  protected async callLLM(
    systemPrompt: string,
    userPrompt: string,
    tools: Tool[] = []
  ): Promise<{ text: string; usage: { totalTokens: number } }> {
    const toolDefinitions = tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || {
          type: 'object' as const,
          properties: {},
        },
      },
    }));

    interface MessageParam {
      role: 'user' | 'assistant' | 'system';
      content: string | unknown[];
      tool_calls?: unknown[];
    }

    const messages: MessageParam[] = [
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    let response = await openrouter.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ] as unknown[] as OpenAI.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 4096,
      tools: toolDefinitions.length > 0 ? (toolDefinitions as unknown as OpenAI.ChatCompletionTool[]) : undefined,
    });

    let finalContent = response.choices[0]?.message?.content || '';

    while (response.choices[0]?.message?.tool_calls && response.choices[0]?.message?.tool_calls.length > 0) {
      const toolCalls = response.choices[0].message.tool_calls;

      const toolResults: unknown[] = [];

      for (const toolCall of toolCalls) {
        const tool = tools.find((t) => t.name === (toolCall as unknown as { function: { name: string } }).function.name);
        if (!tool) continue;

        try {
          const funcCall = toolCall as unknown as { function: { name: string; arguments: string }; id: string };
          const args = JSON.parse(funcCall.function.arguments);
          const result = await tool.execute(...Object.values(args));
          toolResults.push({
            type: 'tool_result',
            tool_call_id: funcCall.id,
            content: result,
          });
        } catch (error) {
          const funcCall = toolCall as unknown as { id: string };
          toolResults.push({
            type: 'tool_result',
            tool_call_id: funcCall.id,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            is_error: true,
          });
        }
      }

      messages.push({
        role: 'assistant',
        content: response.choices[0].message.content || '',
        tool_calls: toolCalls,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      response = await openrouter.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ] as unknown[] as OpenAI.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 4096,
        tools: toolDefinitions.length > 0 ? (toolDefinitions as unknown as OpenAI.ChatCompletionTool[]) : undefined,
      });

      finalContent = response.choices[0]?.message?.content || finalContent;
    }

    return {
      text: finalContent,
      usage: {
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }
}
