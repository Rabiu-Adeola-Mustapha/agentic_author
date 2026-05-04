/**
 * Central model registry for the Agentic Author pipeline.
 * All models are routed via OpenRouter.
 *
 * Model assignments (by role):
 * - GUARDRAIL_FAST   : meta-llama/llama-guard-3-8b  (fast, purpose-built safety model)
 * - GUARDRAIL_DEEP   : anthropic/claude-3.5-sonnet   (deep semantic safety analysis)
 * - PROMPT_WRITER    : anthropic/claude-3-opus        (creative intent clarification)
 * - PLANNER          : openai/gpt-4o                 (structured planning + reasoning)
 * - RESEARCHER       : x-ai/grok-2                   (real-world knowledge + search grounding)
 * - WRITER           : anthropic/claude-3-5-sonnet   (long-form prose excellence)
 * - EVALUATOR        : openai/gpt-4o                 (strict QA + scoring)
 */

export const MODELS = {
  /** Purpose-built safety classifier */
  GUARDRAIL_FAST: process.env.MODEL_GUARDRAIL_FAST || 'anthropic/claude-3-haiku',

  /** Deep semantic safety + sanitisation */
  GUARDRAIL_DEEP: process.env.MODEL_GUARDRAIL_DEEP || 'openai/gpt-4o',

  /** PromptWriter — high reasoning capability */
  PROMPT_WRITER: process.env.MODEL_PROMPT_WRITER || 'openai/gpt-4o',

  /** Planner — structural logic */
  PLANNER: process.env.MODEL_PLANNER || 'openai/gpt-4o',

  /** Researcher — massive context window */
  RESEARCHER: process.env.MODEL_RESEARCHER || 'openai/gpt-4o',

  /** Writer — creative prose */
  WRITER: process.env.MODEL_WRITER || 'openai/gpt-4o',

  /** Evaluator — objective analysis */
  EVALUATOR: process.env.MODEL_EVALUATOR || 'openai/gpt-4o',
} as const;
