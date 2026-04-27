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
  /** Purpose-built safety classifier — fastest, lowest cost */
  GUARDRAIL_FAST: process.env.MODEL_GUARDRAIL_FAST || 'meta-llama/llama-guard-3-8b',

  /** Deep semantic safety + sanitisation — Claude's comprehension */
  GUARDRAIL_DEEP: process.env.MODEL_GUARDRAIL_DEEP || 'anthropic/claude-3.5-sonnet',

  /** PromptWriter — creative clarification and intent expansion */
  PROMPT_WRITER: process.env.MODEL_PROMPT_WRITER || 'anthropic/claude-3-opus',

  /** Planner — structured reasoning, section architecture */
  PLANNER: process.env.MODEL_PLANNER || 'openai/gpt-4o',

  /** Researcher — broad world knowledge + real-world grounding */
  RESEARCHER: process.env.MODEL_RESEARCHER || 'x-ai/grok-2',

  /** Writer — long-form prose, narrative quality */
  WRITER: process.env.MODEL_WRITER || 'anthropic/claude-3.5-sonnet',

  /** Evaluator — strict scoring, QA, objective analysis */
  EVALUATOR: process.env.MODEL_EVALUATOR || 'openai/gpt-4o',
} as const;
