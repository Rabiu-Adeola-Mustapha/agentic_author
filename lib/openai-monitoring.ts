import logger from './logger';
import { OpenAI } from 'openai';

interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

interface APICallMetrics extends TokenMetrics {
  model: string;
  agentName: string;
  duration: number;
  success: boolean;
  toolCalls?: number;
  error?: string;
}

// Pricing for different models (approximate, update as needed)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'grok-2': { input: 0.002, output: 0.01 }, // OpenRouter pricing
};

export class AIMonitor {
  private static sessionMetrics: APICallMetrics[] = [];
  private static totalCost = 0;

  /**
   * Track OpenAI API call metrics
   */
  static logAPICall(metrics: APICallMetrics): void {
    this.sessionMetrics.push(metrics);

    const pricing = MODEL_PRICING[metrics.model] || {
      input: 0,
      output: 0,
    };

    const estimatedCost =
      (metrics.promptTokens * pricing.input +
        metrics.completionTokens * pricing.output) /
      1000;

    this.totalCost += estimatedCost;

    logger.info('OpenAI API Call', {
      agent: metrics.agentName,
      model: metrics.model,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      totalTokens: metrics.totalTokens,
      duration: `${metrics.duration}ms`,
      toolCalls: metrics.toolCalls || 0,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
      success: metrics.success,
      error: metrics.error || undefined,
    });

    // Log to AI usage file for analytics
    logger.info('', {
      level: 'ai-usage',
      agent: metrics.agentName,
      model: metrics.model,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      totalTokens: metrics.totalTokens,
      durationMs: metrics.duration,
      toolCalls: metrics.toolCalls || 0,
      estimatedCostUSD: parseFloat(estimatedCost.toFixed(6)),
      success: metrics.success,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log token usage from OpenAI response
   */
  static logTokenUsage(
    agentName: string,
    model: string,
    usage: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    } | null | undefined,
    durationMs: number,
    success = true,
    error?: string
  ): void {
    if (!usage) {
      logger.warn('Missing token usage data', { agent: agentName, model });
      return;
    }

    this.logAPICall({
      agentName,
      model,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      duration: durationMs,
      success,
      error,
    });
  }

  /**
   * Log tool execution
   */
  static logToolExecution(
    agentName: string,
    toolName: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    logger.debug('Tool Execution', {
      agent: agentName,
      tool: toolName,
      duration: `${duration}ms`,
      success,
      error: error || undefined,
    });
  }

  /**
   * Get session summary
   */
  static getSessionSummary() {
    const totalTokens = this.sessionMetrics.reduce(
      (sum, m) => sum + m.totalTokens,
      0
    );
    const totalCalls = this.sessionMetrics.length;
    const successfulCalls = this.sessionMetrics.filter((m) => m.success).length;
    const failedCalls = totalCalls - successfulCalls;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalTokens,
      totalCost: parseFloat(this.totalCost.toFixed(6)),
      averageTokensPerCall: Math.round(totalTokens / (totalCalls || 1)),
      averageCostPerCall: parseFloat(
        (this.totalCost / (totalCalls || 1)).toFixed(6)
      ),
      metrics: this.sessionMetrics,
    };
  }

  /**
   * Log session summary
   */
  static logSessionSummary(): void {
    const summary = this.getSessionSummary();
    logger.info('Session Summary', summary);
  }

  /**
   * Reset session metrics (useful for testing or new sessions)
   */
  static resetMetrics(): void {
    this.sessionMetrics = [];
    this.totalCost = 0;
  }

  /**
   * Wrap an OpenAI API call with automatic monitoring
   */
  static async withMonitoring<T>(
    agentName: string,
    model: string,
    callback: () => Promise<{ result: T; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const response = await callback();
      const duration = performance.now() - startTime;

      if (response.usage) {
        this.logTokenUsage(agentName, model, response.usage, Math.round(duration), true);
      }

      return response.result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logAPICall({
        agentName,
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration: Math.round(duration),
        success: false,
        error: errorMessage,
      });

      throw error;
    }
  }
}

export default AIMonitor;
