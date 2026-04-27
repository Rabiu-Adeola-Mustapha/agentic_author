import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, OutputData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { OutputModel } from '@/lib/db/models/Output';
import { outputDataSchema } from '@/lib/guardrails/output-validator';
import { MODELS } from '@/lib/config/models';

interface WriterInput extends AgentInput {
  researchId: string;
}

export class Writer extends BaseAgent<WriterInput, OutputData> {
  readonly name = 'Writer';
  protected readonly model = MODELS.WRITER;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
The model is an expert, top-tier writer and subject matter expert in the specific content category. It possesses perfect grammar, an expansive vocabulary, and a deep understanding of category-specific rhetorical techniques. Its sole purpose is to write one specific section of a larger document flawlessly, adhering strictly to the provided plan, formatting rules, and research insights.

PRIMARY TASK:
You will be given the overall context of the document, the full structural outline, the specific section you must write right now, the formatting rules, and a list of researched key insights. Write the complete, final prose for this specific section. Seamlessly weave relevant key insights into the narrative as supporting evidence. Adhere strictly to the requested tone and estimated word count for this section. Apply all formatting rules flawlessly using standard Markdown.

OUTPUT CONTRACT:
Respond with a valid JSON object. The object must have exactly three keys:
- content: a single string containing the full markdown text for this section.
- wordCount: an integer count of the words in the content.
- sections: an array containing exactly one object with title and content mirroring the above, to ensure structural consistency.
Do NOT include anything outside the JSON object.

QUALITY STANDARDS:
The prose must be engaging, authoritative, and perfectly suited to the target audience. Sentences should vary in length and structure to maintain rhythm. Paragraphs should be focused and logical. If key insights are provided, they must be integrated naturally, not clumsily dropped in. The final word count must be within +/- 15% of the section's estimatedWords target.

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
For thesis and journal categories: maintain an objective, academic tone. Avoid first-person pronouns unless explicitly permitted by the formatting rules. Use the provided citation markers (e.g., [1], [2]) exactly where the cited insight is used.
For book and screenplay categories: focus on narrative flow, show-don't-tell techniques, and emotional resonance. Dialogue, if required, must be formatted correctly and sound natural.
For educational categories: use clear, accessible language. Bold key terms on first use. Include formatting like bulleted lists if they aid comprehension.

FORBIDDEN BEHAVIOURS:
Do not write an introduction or conclusion to the overall document unless you are explicitly writing the introduction or conclusion section. Do not refer to "in this section" or "in the next section" unless rhetorically necessary. Do not hallucinate data, statistics, or facts — if you need a fact, use the provided keyInsights. Do not output anything outside the JSON structure.`;
  }

  async run(input: WriterInput): Promise<AgentResult<OutputData>> {
    try {
      await this.updateProjectStage(input.projectId, 'writing');
      await connectDB();
      
      const project = await ProjectModel.findById(input.projectId);
      if (!project) throw new Error('Project not found');

      const promptData = await PromptModel.findById(project.promptId);
      if (!promptData) throw new Error('Prompt not found');

      const plan = await PlanModel.findById(project.planId);
      if (!plan) throw new Error('Plan not found');

      const research = await ResearchModel.findById(input.researchId);
      if (!research) throw new Error('Research not found');

      const systemMessage = this.buildSystemMessage(project.category);

      let totalTokens = 0;
      let fullContent = '';
      let totalWordCount = 0;
      const allSections: { title: string; content: string }[] = [];

      for (const section of plan.structure) {
        let userPrompt = `TOPIC CONTEXT:\n${promptData.finalPrompt}\n\n`;
        userPrompt += `CONTENT STRATEGY:\n${plan.contentStrategy}\n\n`;
        userPrompt += `FORMATTING RULES:\n${JSON.stringify(plan.formattingRules, null, 2)}\n\n`;
        userPrompt += `KEY INSIGHTS:\n${research.keyInsights.join('\n')}\n\n`;
        userPrompt += `FULL DOCUMENT STRUCTURE:\n${plan.structure.map((s: any) => s.title).join(', ')}\n\n`;
        userPrompt += `=========================\n`;
        userPrompt += `YOUR TASK: Write ONLY the following section.\n`;
        userPrompt += `SECTION TITLE: ${section.title}\n`;
        userPrompt += `SECTION DESCRIPTION: ${section.description}\n`;
        userPrompt += `TARGET WORD COUNT: ${section.estimatedWords} words\n`;

        let result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;

        let parsed: OutputData;
        try {
          parsed = this.parseJsonResponse(result.text, outputDataSchema);
        } catch (error) {
          userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact keys content, wordCount, and sections. No other text.";
          result = await this.callLLM(systemMessage, userPrompt);
          totalTokens += result.usage.totalTokens;
          parsed = this.parseJsonResponse(result.text, outputDataSchema);
        }

        fullContent += `## ${section.title}\n\n${parsed.content}\n\n`;
        totalWordCount += parsed.wordCount;
        if (parsed.sections && parsed.sections.length > 0) {
          allSections.push(parsed.sections[0]);
        } else {
          allSections.push({ title: section.title, content: parsed.content });
        }
      }

      const output = await OutputModel.create({
        projectId: input.projectId,
        planId: plan._id,
        content: fullContent.trim(),
        sections: allSections,
        wordCount: totalWordCount,
      });

      project.outputId = output._id;
      await project.save();

      return {
        success: true,
        data: {
          content: fullContent.trim(),
          sections: allSections,
          wordCount: totalWordCount,
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
