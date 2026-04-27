import { BaseAgent, Tool } from './base-agent';
import { AgentInput, AgentResult, ResearchData } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { searchWeb } from '@/lib/search/ddg';
import {
  validateAgentOutput,
  ResearchDataSchema,
} from '@/lib/guardrails/output-validator';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';

interface ResearcherInput extends AgentInput {
  planId: string;
}

export class Researcher extends BaseAgent<ResearcherInput, ResearchData> {
  readonly name = 'Researcher';
  readonly instructions = `You are a research assistant. You search the web for information and produce a comprehensive research summary.
You have access to a search_the_web tool. Use it to find relevant sources and information.
Return your findings as a JSON object with "sources" (array of {title, url, snippet}) and "keyInsights" (array of strings).
Focus on extracting the most relevant and factual information.`;

  readonly tools: Tool[] = [
    {
      name: 'search_the_web',
      description:
        'Searches the web for the given query and returns relevant results with titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find information about',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (default 5)',
          },
        },
        required: ['query'],
      },
      execute: async (...args: unknown[]) => {
        const query = args[0] as string;
        const maxResults = (args[1] as number) || 5;
        const results = await searchWeb(query, maxResults);
        return JSON.stringify(results);
      },
    },
  ];

  async run(input: ResearcherInput): Promise<AgentResult<ResearchData>> {
    try {
      await connectDB();

      const plan = await PlanModel.findById(input.planId);
      if (!plan) {
        return {
          success: false,
          error: 'Plan not found',
        };
      }

      const config = CATEGORY_CONFIG[input.category];
      const researchDepth = config.researchDepth;
      let numQueries = 2;
      if (researchDepth === 'deep') numQueries = 5;
      else if (researchDepth === 'moderate') numQueries = 3;

      const systemPrompt = `You are a research assistant expert at finding and synthesizing information.
You will search the web for information related to the following content strategy and return structured research data.
Always return your final response as a JSON object with this exact structure:
{
  "sources": [{"title": "string", "url": "string", "snippet": "string"}],
  "keyInsights": ["insight 1", "insight 2", ...]
}`;

      const userPrompt = `Research the following content strategy and extract key information:

Content Strategy: ${plan.contentStrategy}
Structure/Topics: ${plan.structure.join(', ')}

Generate and execute approximately ${numQueries} search queries to find relevant sources and insights.
Then synthesize the findings into the required JSON format.
Return ONLY the JSON object with no additional text.`;

      const result = await this.callLLM(systemPrompt, userPrompt, this.tools);

      let researchData: ResearchData = {
        sources: [],
        keyInsights: [],
      };

      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          researchData = {
            sources: parsed.sources || [],
            keyInsights: parsed.keyInsights || [],
          };
        }
      } catch (error) {
        console.error('Failed to parse research output:', error);
        researchData = {
          sources: [],
          keyInsights: ['Research completed with tool results'],
        };
      }

      const validated = validateAgentOutput(researchData, ResearchDataSchema);

      const research = await ResearchModel.create({
        projectId: input.projectId,
        planId: input.planId,
        sources: validated.sources,
        keyInsights: validated.keyInsights,
      });

      await ProjectModel.updateOne(
        { _id: input.projectId },
        { researchId: research._id, currentStage: 'writing' }
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
