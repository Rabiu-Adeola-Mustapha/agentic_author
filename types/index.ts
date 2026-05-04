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
  | 'prompt_review'
  | 'plan'
  | 'plan_review'
  | 'research'
  | 'research_review'
  | 'writing'
  | 'evaluation'
  | 'evaluation_review'
  | 'done'
  | 'failed';

export type ProjectStatus = 'draft' | 'running' | 'awaiting_approval' | 'completed' | 'failed';

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
  structuredIntent: {
    topic: string;
    audience: string;
    tone: string;
    length: string;
    keyRequirements: string[];
  };
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

export interface SerializedProject {
  _id: string;
  userId: string;
  title: string;
  category: ContentCategory;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OutputSection {
  key: string;
  title: string;
  content: string;
  wordCount?: number;
}

export interface SerializedOutput {
  _id: string;
  projectId: string;
  content: string;
  sections: OutputSection[];
  wordCount: number;
  metadata?: {
    targetWordCount?: number;
  };
}

export interface SerializedEvaluation {
  _id: string;
  projectId: string;
  score: number;
  alignmentScore: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
  passedThreshold: boolean;
}

export interface SerializedPrompt {
  _id: string;
  projectId: string;
  structuredIntent: any;
  finalPrompt: string;
}

export interface SerializedPlan {
  _id: string;
  projectId: string;
  structure: any[];
}

export interface SerializedResearch {
  _id: string;
  projectId: string;
  sources: any[];
  keyInsights: string[];
}
