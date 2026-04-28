import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, EvaluationData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { OutputModel } from '@/lib/db/models/Output';
import { EvaluationModel } from '@/lib/db/models/Evaluation';
import { evaluationOutputSchema } from '@/lib/guardrails/output-validator';
import { MODELS } from '@/lib/config/models';

interface EvaluatorInput extends AgentInput {
  outputId: string;
}

export class Evaluator extends BaseAgent<EvaluatorInput, EvaluationData> {
  readonly name = 'Evaluator';
  protected readonly model = MODELS.EVALUATOR;

  buildSystemMessage(category: ContentCategory): string {
    return `IDENTITY AND ROLE:
The model is a ruthless, meticulous senior editor and QA specialist. It does not write or fix content — it evaluates content against strict criteria, scoring it objectively and identifying every flaw, inconsistency, or deviation from the brief.

PRIMARY TASK:
Review the complete generated content against the finalPrompt (the brief), the formattingRules, and the keyInsights. Calculate three scores out of 100: an overall score, an alignmentScore (how well it followed the brief and formatting rules), and a qualityScore (the quality of the prose, grammar, and flow). List all specific issues found. Provide actionable suggestions for improvement.

OUTPUT CONTRACT:
Respond with a valid JSON object. The object must have exactly five keys:
- score: integer between 0 and 100.
- alignmentScore: integer between 0 and 100.
- qualityScore: integer between 0 and 100.
- issues: an array of strings detailing specific problems found.
- suggestions: an array of strings detailing actionable improvements.
Do NOT include anything outside the JSON object.

QUALITY STANDARDS:
Be incredibly strict. A score of 100 means the content is publication-ready and flawless. A score of 80 is acceptable but needs minor edits. A score below 80 means the content failed to meet professional standards. If an insight from the keyInsights list was required but missing, penalise the alignmentScore heavily. If the formatting rules were ignored, penalise the alignmentScore heavily. Issues must be specific ("Paragraph 3 uses passive voice heavily") not general ("The writing is sometimes passive").

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
For thesis and journal categories: strictly evaluate the adherence to academic tone and correct usage of citations. If citations are missing or hallucinated, the alignmentScore must be below 60.
For book and screenplay categories: evaluate the pacing, character consistency, and narrative engagement. If the text reads like a textbook rather than a narrative, the qualityScore must be below 70.
For educational categories: evaluate clarity, pedagogical value, and the alignment with stated learning objectives.

FORBIDDEN BEHAVIOURS:
Do not be polite or encouraging — be brutally objective. Do not provide a score of 100 if there are any issues listed. Do not output anything outside the JSON structure. Do not evaluate the quality of the prompt or the plan, only evaluate the final content.`;
  }

  async run(input: EvaluatorInput): Promise<AgentResult<EvaluationData>> {
    try {
      await this.updateProjectStage(input.projectId, 'evaluation');
      await connectDB();
      
      const project = await ProjectModel.findById(input.projectId);
      if (!project) throw new Error('Project not found');

      const promptData = await PromptModel.findById(project.promptId);
      if (!promptData) throw new Error('Prompt not found');

      const plan = await PlanModel.findById(project.planId);
      if (!plan) throw new Error('Plan not found');

      const research = await ResearchModel.findById(project.researchId);
      if (!research) throw new Error('Research not found');

      const output = await OutputModel.findById(input.outputId);
      if (!output) throw new Error('Output not found');

      const systemMessage = this.buildSystemMessage(project.category);

      let userPrompt = `FINAL PROMPT (The Brief):\n${promptData.finalPrompt}\n\n`;
      userPrompt += `FORMATTING RULES:\n${JSON.stringify(plan.formattingRules, null, 2)}\n\n`;
      userPrompt += `KEY INSIGHTS:\n${research.keyInsights.join('\n')}\n\n`;
      userPrompt += `=========================\n`;
      userPrompt += `GENERATED CONTENT TO EVALUATE:\n${output.content}\n`;

      let result = await this.callLLM(systemMessage, userPrompt);
      let totalTokens = result.usage.totalTokens;

      let parsed: EvaluationData;
      try {
        parsed = this.parseJsonResponse(result.text, evaluationOutputSchema) as unknown as EvaluationData;
      } catch (error) {
        userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact keys score, alignmentScore, qualityScore, issues, and suggestions. No other text.";
        result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, evaluationOutputSchema) as unknown as EvaluationData;
      }

      const passedThreshold = parsed.score >= 80 && parsed.alignmentScore >= 80 && parsed.qualityScore >= 80;

      const evaluation = await EvaluationModel.create({
        projectId: input.projectId,
        outputId: input.outputId,
        score: parsed.score,
        alignmentScore: parsed.alignmentScore,
        qualityScore: parsed.qualityScore,
        issues: parsed.issues,
        suggestions: parsed.suggestions,
        passedThreshold,
      });

      project.evaluationId = evaluation._id;
      project.status = 'completed';
      project.currentStage = 'done';
      
      await project.save();

      return {
        success: true,
        data: {
          score: parsed.score,
          alignmentScore: parsed.alignmentScore,
          qualityScore: parsed.qualityScore,
          issues: parsed.issues,
          suggestions: parsed.suggestions,
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
