import { BaseAgent, Tool } from './base-agent';
import { AgentInput, AgentResult, OutputData } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { OutputModel } from '@/lib/db/models/Output';
import {
  validateAgentOutput,
  OutputDataSchema,
} from '@/lib/guardrails/output-validator';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';

interface WriterInput extends AgentInput {
  researchId: string;
}

export class Writer extends BaseAgent<WriterInput, OutputData> {
  readonly name = 'Writer';
  readonly instructions = `You are a professional content writer. Your task is to write high-quality content sections based on the plan and research provided.
Write engaging, well-structured content that follows the formatting rules and incorporates research insights.
Return the complete content as a JSON object with the required structure.`;

  readonly tools: Tool[] = [];

  async run(input: WriterInput): Promise<AgentResult<OutputData>> {
    try {
      await connectDB();

      const research = await ResearchModel.findById(input.researchId);
      if (!research) {
        return { success: false, error: 'Research not found' };
      }

      const plan = await PlanModel.findById(research.planId);
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const prompt = await PromptModel.findById(plan.promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const project = await ProjectModel.findById(input.projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      const config = CATEGORY_CONFIG[input.category];
      const userPlan = (project.userId as any).subscription?.plan || 'free';
      const maxWords = config.maxWordsPerTier[userPlan as 'free' | 'pro'];

      const sections: Array<{ title: string; content: string }> = [];
      let totalWordCount = 0;

      for (const section of plan.structure) {
        if (totalWordCount >= maxWords) {
          break;
        }

        const remainingWords = maxWords - totalWordCount;
        const systemPrompt = `You are a professional content writer specializing in ${config.writingStyle} writing.

Write the "${section}" section of ${input.category} content. Follow these guidelines:
- Maintain the writing style: ${config.writingStyle}
- Target approximately ${Math.min(remainingWords, 2000)} words for this section
- Formatting rule: ${plan.formattingRules[section] || 'No special formatting required'}
${config.citationRequired ? '- Include [1], [2], etc. for citations as needed' : ''}
- Use the research insights provided`;

        const researchContext = research.keyInsights
          .slice(0, 5)
          .map((insight: string) => `- ${insight}`)
          .join('\n');

        const sectionPrompt = `Write the "${section}" section based on this prompt:
${prompt.finalPrompt}

Key research insights:
${researchContext}

Maintain the content strategy: ${plan.contentStrategy}`;

        const result = await this.callLLM(systemPrompt, sectionPrompt, []);

        const content = result.text;
        const wordCount = content.split(/\s+/).length;
        totalWordCount += wordCount;

        sections.push({
          title: section,
          content,
        });
      }

      let fullContent = sections
        .map((s) => `# ${s.title}\n\n${s.content}`)
        .join('\n\n');

      if (config.citationRequired) {
        const referenceSection = `\n\n## References\n\n${research.sources
          .map((source: unknown, i: number) => `[${i + 1}] ${(source as any).title}: ${(source as any).url}`)
          .join('\n')}`;

        fullContent += referenceSection;
        sections.push({
          title: 'References',
          content: research.sources
            .map((source: unknown, i: number) => `[${i + 1}] ${(source as any).title}: ${(source as any).url}`)
            .join('\n'),
        });
      }

      const outputData: OutputData = {
        content: fullContent,
        sections,
        wordCount: totalWordCount,
      };

      const validated = validateAgentOutput(outputData, OutputDataSchema);

      const output = await OutputModel.create({
        projectId: input.projectId,
        planId: research.planId,
        researchId: input.researchId,
        content: validated.content,
        sections: validated.sections,
        wordCount: validated.wordCount,
        metadata: {},
      });

      await ProjectModel.updateOne(
        { _id: input.projectId },
        { outputId: output._id, currentStage: 'evaluation' }
      );

      return {
        success: true,
        data: validated,
        tokensUsed: sections.length * 4096,
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
