import { OpenAI } from 'openai';
import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, ResearchData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { searchWeb } from '@/lib/search/ddg-search';
import { MODELS } from '@/lib/config/models';

const MAX_TOOL_CALLS = 7;

interface ResearcherInput extends AgentInput {
  planId: string;
  feedback?: string;
}

// Tool definition for the LLM to call
const searchTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_web',
    description:
      'Search the web for information on a topic. Use this to find facts, statistics, examples, and credible sources relevant to the content project. Call this multiple times with different queries to gather comprehensive research.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The specific search query. Be precise and targeted — avoid generic queries. Use natural language questions or specific keyword combinations.',
        },
      },
      required: ['query'],
    },
  },
};

export class Researcher extends BaseAgent<ResearcherInput, ResearchData> {
  readonly name = 'Researcher';
  protected readonly model = MODELS.RESEARCHER;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
You are a world-class research analyst embedded in an AI content pipeline. You have access to a real-time web search tool. Your mission is to gather the most relevant, credible, and insightful information for a specific content project by strategically calling the search tool.

PRIMARY TASK:
You will be given a content brief (the finalPrompt). Your job is to:
1. Analyse the brief to identify the key topics, angles, and knowledge gaps that must be filled.
2. Call the search_web tool strategically — start broad, then drill into specific subtopics based on what you find.
3. After each search result, decide whether to search again for more depth or a new angle.
4. Stop searching when you have gathered 8-12 high-quality, diverse insights covering the topic comprehensively.

TOOL CALLING STRATEGY:
- First call: Search for the core topic and get an overview.
- Subsequent calls: Drill into specific angles you discovered — statistics, recent events, expert opinions, case studies.
- Vary your queries to cover different aspects: historical context, current trends, cultural nuance, data/statistics, notable examples.
- You have a maximum of ${MAX_TOOL_CALLS} searches. Use them wisely.

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
For thesis and journal: prioritise peer-reviewed sources. Tag them as "(peer-reviewed source: domain.com)".
For book and screenplay: prioritise cultural, historical, and psychological insights.
For educational: prioritise research from educational institutions and pedagogical literature.

FORBIDDEN BEHAVIOURS:
Do not fabricate sources. Only report what is in the search results. Do not repeat the same insight twice.`;
  }

  async run(input: ResearcherInput): Promise<AgentResult<ResearchData>> {
    try {
      await this.updateProjectStage(input.projectId, 'research');
      await connectDB();

      const project = await ProjectModel.findById(input.projectId);
      if (!project) throw new Error('Project not found');

      const plan = await PlanModel.findById(input.planId);
      if (!plan) throw new Error('Plan not found');

      const promptData = await PromptModel.findById(project.promptId);
      if (!promptData) throw new Error('Prompt not found');

      const systemMessage = this.buildSystemMessage(project.category);

      let initialUserMessage = `CONTENT BRIEF (finalPrompt):\n${promptData.finalPrompt}\n\n`;
      initialUserMessage += `SUGGESTED STARTING QUERIES (from the content plan):\n${(plan.searchQueries || []).join('\n')}\n\n`;
      if (input.feedback) {
        initialUserMessage += `USER GUIDANCE / ADDITIONAL DIRECTION:\n${input.feedback}\n\n`;
      }
      initialUserMessage += `Begin your research now. Call the search_web tool to find relevant information. You may call it up to ${MAX_TOOL_CALLS} times.`;

      const openrouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'Agentic Author',
        },
      });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: initialUserMessage },
      ];

      let totalTokens = 0;
      let toolCallCount = 0;
      const allSources: { title: string; url: string; snippet: string; score?: number }[] = [];
      const citationMap: Record<string, number> = {};
      let citationCounter = 1;

      // === PHASE 1: Adaptive Tool-Calling Loop ===
      while (toolCallCount < MAX_TOOL_CALLS) {
        console.log(`[Researcher] Tool-calling loop iteration ${toolCallCount + 1}/${MAX_TOOL_CALLS}`);

        const response = await openrouter.chat.completions.create({
          model: this.model,
          messages,
          tools: [searchTool],
          tool_choice: toolCallCount < 2 ? 'required' : 'auto',
          temperature: 0.3,
          max_tokens: 2048,
        });

        totalTokens += response.usage?.total_tokens || 0;
        const message = response.choices[0]?.message;

        if (!message) break;

        messages.push({
          role: 'assistant',
          content: message.content || null,
          ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam);

        if (response.choices[0].finish_reason === 'stop' || !message.tool_calls?.length) {
          console.log(`[Researcher] LLM chose to stop searching after ${toolCallCount} searches.`);
          break;
        }

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function' || toolCall.function.name !== 'search_web') continue;

          let query = '';
          try {
            const args = JSON.parse(toolCall.function.arguments);
            query = args.query;
          } catch {
            query = toolCall.function.arguments;
          }

          console.log(`[Researcher] Tool Call ${toolCallCount + 1}: Searching for "${query}"`);
          toolCallCount++;

          const results = await searchWeb(query).catch(() => []);

          for (const res of results) {
            if (!citationMap[res.url]) {
              citationMap[res.url] = citationCounter++;
              allSources.push(res);
            }
          }

          const formattedResults =
            results.length > 0
              ? results
                  .map((res) => {
                    let domain = 'unknown';
                    try {
                      domain = new URL(res.url).hostname;
                    } catch {}
                    return `[Citation ${citationMap[res.url]}] Source: ${domain}\nTitle: ${res.title}\nSnippet: ${res.snippet}`;
                  })
                  .join('\n\n')
              : 'No results found for this query. Try a different search term.';

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: formattedResults,
          });
        }
      }

      // === PHASE 2: Force Final Synthesis (no tools) ===
      console.log(`[Researcher] Phase 2: Forcing final synthesis after ${toolCallCount} searches.`);
      messages.push({
        role: 'user',
        content: `You have completed your web research. Based on everything you have found, synthesize your findings now.\n\nReturn ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:\n{"keyInsights": ["Insight 1 (source: domain.com)", "Insight 2...", ...]}\n\nAim for 8-12 specific, evidence-backed insights covering diverse angles of the topic.`,
      });

      const finalResponse = await openrouter.chat.completions.create({
        model: this.model,
        messages,
        tool_choice: 'none',
        temperature: 0.3,
        max_tokens: 4096,
      });

      totalTokens += finalResponse.usage?.total_tokens || 0;
      const finalText = finalResponse.choices[0]?.message?.content || '';
      console.log(`[Researcher] Final synthesis received. Length: ${finalText.length} chars.`);

      let keyInsights: string[] = [];
      try {
        let cleanText = finalText.trim();
        if (cleanText.startsWith('```')) {
          const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match?.[1]) cleanText = match[1];
        }
        const parsed = JSON.parse(cleanText);
        keyInsights = parsed.keyInsights || [];
      } catch {
        console.warn('[Researcher] Could not parse final JSON, extracting from text...');
        keyInsights = finalText
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map((line) => line.replace(/^[-\d.]\s*/, '').trim())
          .filter(Boolean);
      }

      if (keyInsights.length === 0) {
        throw new Error('Researcher agent returned no key insights');
      }

      const research = await ResearchModel.create({
        projectId: input.projectId,
        planId: input.planId,
        sources: allSources,
        keyInsights,
        citationMap,
      });

      project.researchId = research._id;
      await project.save();

      return {
        success: true,
        data: {
          sources: allSources,
          keyInsights,
        },
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
