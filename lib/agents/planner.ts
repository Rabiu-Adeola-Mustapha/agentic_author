import { BaseAgent } from './base-agent';
import { AgentInput, AgentResult, PlanData, ContentCategory } from '@/types';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { planOutputSchema } from '@/lib/guardrails/output-validator';
import { MODELS } from '@/lib/config/models';

interface PlannerInput extends AgentInput {
  promptId: string;
}

export class Planner extends BaseAgent<PlannerInput, PlanData> {
  readonly name = 'Planner';
  protected readonly model = MODELS.PLANNER;

  private getRequiredSections(category: ContentCategory): string[] {
    switch (category) {
      case 'thesis':
        return ['abstract', 'introduction', 'literature_review', 'methodology', 'results_and_findings', 'discussion', 'conclusion', 'references'];
      case 'journal':
        return ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'references'];
      case 'book':
        return ['premise_and_synopsis', 'character_profiles', 'world_building', 'chapter_outline', 'chapter_one', 'chapter_two', 'chapter_three']; // Ensure at least 5 sections, usually chapter_one, two, three
      case 'screenplay':
        return ['logline_and_premise', 'character_profiles', 'act_one_setup', 'act_two_confrontation', 'act_three_resolution', 'scene_list'];
      case 'educational':
        return ['learning_objectives', 'course_overview', 'module_one', 'module_two', 'module_three', 'activities_and_exercises', 'assessments_and_rubrics'];
      // add article writing structure and content/social media writing structure
      case 'article':
        return ['introduction', 'body_paragraph_one', 'body_paragraph_two', 'body_paragraph_three', 'conclusion'];
      case 'social_media':
        return ['hook', 'context', 'value_points', 'call_to_action'];
      default:
        return [];
    }
  }

  buildSystemMessage(category: ContentCategory): string {
    const requiredSections = this.getRequiredSections(category).join(', ');
    return `IDENTITY AND ROLE:
The model is a senior content architect and editorial strategist. It specialises in designing comprehensive content structures that are logical, well-proportioned, and precisely tailored to the content category. It does not write content — it designs the blueprint that the writer will follow, ensuring the result will be coherent and complete.

PRIMARY TASK:
Analyse the finalPrompt provided. Design a content structure by dividing the document into named, well-described sections following the exact structural conventions required for this content type. For every section, write a description that tells the writer exactly what must be covered and what the reader must understand by the end of that section. Assign realistic word count targets. Define the document-wide formatting and style rules. Write a content strategy. Generate search queries for the Researcher.

OUTPUT CONTRACT:
Respond with a valid JSON object and nothing else. The object must have exactly five keys:
- contentType: a precise short label for the content being created.
- structure: an array of section objects. Each section object must have four fields: key (a short snake_case identifier for the section), title (the display heading), description (one to two sentences precisely describing what must be covered in this section and what outcome it must achieve for the reader), and estimatedWords (an integer word count target for that section). The structure array must contain every required section for the content category.
- formattingRules: a key-value object where each key is a rule name and each value is the rule's specific instruction.
- contentStrategy: a prose paragraph of 100-150 words describing the editorial approach.
- searchQueries: an array of 3-5 strings. Each string must be a specific, well-formed web search query.

QUALITY STANDARDS:
The estimatedWords values across all sections must sum to a realistic total for the content type. No section may have an estimatedWords below 100 or above 5000. The description for each section must be specific enough that a writer knows exactly what to write — it must not merely repeat the section title. Search queries must target the specific topic, not the content category in general.

CATEGORY-SPECIFIC RULES:
${this.buildCategoryContext(category)}
Mandatory sections that MUST be included in the structure: ${requiredSections}

For thesis: structure must contain sections in this order — abstract, introduction, literature review, methodology, results and findings, discussion, conclusion, references. These eight sections are the minimum. Additional sub-sections may be added but none of these eight may be omitted.
For journal: structure must follow IMRaD in this order — abstract, introduction, methods, results, discussion, conclusion, references. These seven sections are mandatory.
For book: structure must include — premise and synopsis, character profiles (all major characters), world building (setting and context), chapter outline (brief summary of all chapters), then individual full chapter sections (at minimum chapters one, two, and three as separate sections). At least five sections total.
For screenplay: structure must include — logline and premise, character profiles, act one setup, act two confrontation, act three resolution, and a scene list. These six are mandatory.
For educational: structure must include — learning objectives, course overview, at least three content module sections, activities and exercises, and assessments and rubrics. At least seven sections total.

FORBIDDEN BEHAVIOURS:
Do not omit any mandatory section for the content category. Do not invent section keys that are not in the required structure for mandatory ones (you can add extra, but must have mandatory ones). Do not produce a contentStrategy that is a generic description of the content type. Do not generate search queries that are topic-agnostic. Do not produce a structure where all sections have identical estimatedWords.`;
  }

  async run(input: PlannerInput): Promise<AgentResult<PlanData>> {
    try {
      await this.updateProjectStage(input.projectId, 'plan');
      await connectDB();
      const project = await ProjectModel.findById(input.projectId);
      if (!project) throw new Error('Project not found');

      const promptData = await PromptModel.findById(input.promptId);
      if (!promptData) throw new Error('Prompt not found');

      const systemMessage = this.buildSystemMessage(project.category);
      let userPrompt = promptData.finalPrompt;

      let result = await this.callLLM(systemMessage, userPrompt);
      let totalTokens = result.usage.totalTokens;

      let parsed: PlanData;
      try {
        parsed = this.parseJsonResponse(result.text, planOutputSchema) as unknown as PlanData;
      } catch (error) {
        userPrompt += "\nYour previous response could not be parsed as valid JSON. Return only a valid JSON object with the exact keys contentType, structure, formattingRules, contentStrategy, and searchQueries. No other text.";
        result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, planOutputSchema) as unknown as PlanData;
      }

      // Check mandatory sections
      const requiredKeys = this.getRequiredSections(project.category);
      let missingKeys = requiredKeys.filter(k => !parsed.structure.some(s => s.key === k));

      if (missingKeys.length > 0) {
        userPrompt += `\nYour previous response was missing the following mandatory sections: ${missingKeys.join(', ')}. Please return the full JSON again, ensuring all mandatory sections are included in the structure.`;
        result = await this.callLLM(systemMessage, userPrompt);
        totalTokens += result.usage.totalTokens;
        parsed = this.parseJsonResponse(result.text, planOutputSchema) as unknown as PlanData;

        missingKeys = requiredKeys.filter(k => !parsed.structure.some(s => s.key === k));
        if (missingKeys.length > 0) {
          throw new Error(`Planner failed to include mandatory sections: ${missingKeys.join(', ')}`);
        }
      }

      const plan = await PlanModel.create({
        projectId: input.projectId,
        userId: input.userId,
        contentType: parsed.contentType,
        structure: parsed.structure,
        formattingRules: parsed.formattingRules,
        contentStrategy: parsed.contentStrategy,
        searchQueries: parsed.searchQueries,
      });

      project.planId = plan._id;
      await project.save();

      return {
        success: true,
        data: parsed,
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
