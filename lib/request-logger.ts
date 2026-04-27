import logger from './logger';
import AIMonitor from './openai-monitoring';

/**
 * Middleware-like function to log HTTP requests
 */
export function logRequest(
  method: string,
  pathname: string,
  query?: Record<string, unknown>,
  userId?: string
): void {
  logger.info(`${method} ${pathname}`, {
    userId: userId || 'anonymous',
    query: Object.keys(query || {}).length > 0 ? query : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log API response with duration
 */
export function logResponse(
  method: string,
  pathname: string,
  statusCode: number,
  durationMs: number,
  userId?: string,
  error?: Error
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';
  const message = `${method} ${pathname} - ${statusCode}`;

  logger[level as keyof typeof logger](message, {
    statusCode,
    duration: `${durationMs}ms`,
    userId: userId || 'anonymous',
    error: error?.message || undefined,
    stack: error?.stack || undefined,
  });
}

/**
 * Wrapper for tracking agent execution in API routes
 */
export async function trackAgentExecution<T>(
  agentName: string,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    logger.debug(`Executing agent: ${agentName}`);
    const result = await callback();
    const duration = performance.now() - startTime;

    logger.info(`Agent execution completed: ${agentName}`, {
      duration: `${Math.round(duration)}ms`,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Agent execution failed: ${agentName}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Get current session metrics and log summary
 */
export function getSessionMetrics() {
  const summary = AIMonitor.getSessionSummary();
  logger.info('Session Metrics', summary);
  return summary;
}

/**
 * Create a structured logger for API errors
 */
export function logError(
  error: unknown,
  context: {
    route: string;
    userId?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(errorMessage, {
    route: context.route,
    userId: context.userId,
    action: context.action,
    ...context.metadata,
    stack: errorStack,
  });
}

/**
 * Log database operations
 */
export function logDatabase(
  operation: 'create' | 'read' | 'update' | 'delete',
  model: string,
  durationMs: number,
  success: boolean,
  error?: string
): void {
  const level = success ? 'debug' : 'warn';

  logger[level as keyof typeof logger](`DB ${operation.toUpperCase()}`, {
    model,
    duration: `${durationMs}ms`,
    success,
    error: error || undefined,
  });
}

export default {
  logRequest,
  logResponse,
  trackAgentExecution,
  getSessionMetrics,
  logError,
  logDatabase,
};
