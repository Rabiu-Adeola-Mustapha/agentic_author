export type ContentCategory =
  | 'book'
  | 'screenplay'
  | 'thesis'
  | 'journal'
  | 'educational'
  | 'article'
  | 'social_media';

export type PipelineStage =
  | 'idle'
  | 'prompt'
  | 'plan'
  | 'research'
  | 'writing'
  | 'evaluation'
  | 'done'
  | 'failed';

export type ProjectStatus = 'draft' | 'running' | 'completed' | 'failed';

export type SubscriptionPlan = 'free' | 'pro';

export interface AgentInput {
  projectId: string;
  category: ContentCategory;
  userId: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
}

export interface PromptData {
  rawInput: string;
  structuredIntent: Record<string, string>;
  finalPrompt: string;
}

export interface PlanData {
  contentType: string;
  structure: {
    key: string;
    title: string;
    description: string;
    estimatedWords: number;
  }[];
  formattingRules: Record<string, string>;
  contentStrategy: string;
  searchQueries: string[];
}

export interface ResearchData {
  sources: { title: string; url: string; snippet: string }[];
  keyInsights: string[];
}

export interface OutputData {
  content: string;
  sections: { title: string; content: string }[];
  wordCount: number;
}

export interface EvaluationData {
  score: number;
  alignmentScore: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
}

export interface CategoryConfig {
  label: string;
  icon: string;
  description: string;
  planStructure: string[];
  writingStyle: string;
  researchDepth: 'light' | 'moderate' | 'deep';
  citationRequired: boolean;
  maxWordsPerTier: { free: number; pro: number };
}
