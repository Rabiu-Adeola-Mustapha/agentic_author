import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, ResearchData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { researchOutputSchema } from '@/lib/guardrails/output-validator';
import { searchWeb } from '@/lib/search/ddg-search';
import { MODELS } from '@/lib/config/models';

interface ResearcherInput extends AgentInput {
  planId: string;
}

export class Researcher extends BaseAgent<ResearcherInput, ResearchData> {
  readonly name = 'Researcher';
  protected readonly model = MODELS.RESEARCHER;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
The model is an expert research analyst trained in synthesising information from multiple sources quickly and accurately. It receives raw web search snippets and must extract only the most useful, relevant, and credible insights for a specific content project. It does not write content — it distils research into a clean, usable insight list.

PRIMARY TASK:
Review all the search result snippets provided. Each snippet has a source domain attached. Identify the 8-12 most important factual insights, statistics, arguments, or examples that are directly relevant to the content described in the finalPrompt. Prioritise recent sources, authoritative sources (academic journals, government bodies, established news organisations, industry reports), and sources that provide concrete data points or specific examples. Ignore snippets from content farms, low-quality blogs, or sources that are tangentially related to the topic.

OUTPUT CONTRACT:
Respond with a valid JSON object and nothing else. The object must have one key: keyInsights, which is an array of 8-12 strings. Each string must be a single, complete, self-contained sentence in neutral third-person prose. Each string must end with the source domain in parentheses formatted as "(source: domainname.com)". Each insight must be specific enough to be used as supporting evidence in the content — vague paraphrases of common knowledge do not qualify as insights.

QUALITY STANDARDS:
Insights must collectively cover a range of perspectives: factual background, current state of knowledge, key debates, supporting statistics, and concrete examples or case studies. No two insights may convey substantially the same information. Insights that begin with "It is important to..." or "Research shows that..." without citing a specific source or data point are not acceptable — every insight must be grounded in a specific snippet.

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
For thesis and journal categories: prioritise academic, institutional, and government sources. Flag insights from peer-reviewed sources with "(peer-reviewed source: domainname.com)" instead of just source.
For book and screenplay categories: prioritise insights about historical accuracy, cultural context, psychological profiles, or real events that could inform the narrative. Label these appropriately.
For educational categories: prioritise insights from education research, curriculum standards bodies, and pedagogical literature.

FORBIDDEN BEHAVIOURS:
Do not fabricate statistics or invent sources — only report what is present in the provided snippets. Do not include insights that are not relevant to the topic even if they come from authoritative sources. Do not produce fewer than 8 insights unless the search results genuinely do not contain 8 relevant pieces of information — in that case, note the limitation at the end of the insights array as a final string beginning with "NOTE:". Do not combine two separate insights into one string.`;
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

      let numQueries = 2;
      const depth = this.buildCategoryContext(project.category).match(/Research Depth: (light|moderate|deep)/)?.[1] || 'light';
      if (depth === 'moderate') numQueries = 3;
      if (depth === 'deep') numQueries = 5;

      const queriesToRun = (plan.searchQueries || []).slice(0, numQueries);

      const searchResultsArray: any[] = [];
      for (let i = 0; i < queriesToRun.length; i++) {
        const query = queriesToRun[i];
        console.log(`[Researcher] Searching (${i + 1}/${queriesToRun.length}): ${query}`);
        
        const results = await searchWeb(query).catch(() => []);
        if (results && results.length > 0) {
          searchResultsArray.push(results);
        }

        // Sequential delay with jitter to avoid pattern detection
        if (i < queriesToRun.length - 1) {
          const delay = 1000 + Math.random() * 1000; // 1-2s delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      let allResults = searchResultsArray.flat();
      
      // Deduplicate by URL
      const uniqueResultsMap = new Map();
      for (const res of allResults) {
        if (!uniqueResultsMap.has(res.url)) {
          uniqueResultsMap.set(res.url, res);
        }
      }
      
      allResults = Array.from(uniqueResultsMap.values());
      allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      allResults = allResults.slice(0, 15);

      const citationMap: Record<string, number> = {};
      let citationCounter = 1;
      
      const formattedSnippets = allResults.map(res => {
        let domain = 'unknown';
        try {
          const urlObj = new URL(res.url);
          domain = urlObj.hostname;
        } catch {
          // ignore
        }
        
        if (!citationMap[res.url]) {
          citationMap[res.url] = citationCounter++;
        }
        
        return `[Citation ${citationMap[res.url]}] Source: ${domain}\nTitle: ${res.title}\nSnippet: ${res.snippet}\n`;
      }).join('\n');

      const systemMessage = this.buildSystemMessage(project.category);
      let userPrompt = `TOPIC CONTEXT (Final Prompt):\n${promptData.finalPrompt}\n\nSEARCH RESULTS:\n${formattedSnippets}`;

      let result = await this.callLLM(systemMessage, userPrompt);
      let totalTokens = result.usage.totalTokens;

      let parsed: { keyInsights: string[] };
      try {
        parsed = this.parseJsonResponse(result.text, researchOutputSchema);
      } catch (error) {
        userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact key keyInsights. No other text.";
        result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, researchOutputSchema);
      }

      const research = await ResearchModel.create({
        projectId: input.projectId,
        planId: input.planId,
        sources: allResults,
        keyInsights: parsed.keyInsights,
        citationMap,
      });

      project.researchId = research._id;
      await project.save();

      return {
        success: true,
        data: {
          sources: allResults,
          keyInsights: parsed.keyInsights,
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
