import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';
import requestLogger from './request-logger';

/**
 * Wrap API route handlers with automatic logging and error handling
 */
export function withLogging<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T,
  options?: {
    logBody?: boolean;
    logResponse?: boolean;
  }
) {
  return async (request: NextRequest) => {
    const startTime = performance.now();
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    try {
      // Log incoming request
      if (options?.logBody && method !== 'GET') {
        try {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          requestLogger.logRequest(method, pathname, body);
        } catch {
          requestLogger.logRequest(method, pathname);
        }
      } else {
        requestLogger.logRequest(method, pathname);
      }

      // Execute the handler
      const response = await handler(request);

      // Log the response
      const duration = performance.now() - startTime;
      requestLogger.logResponse(
        method,
        pathname,
        response.status,
        Math.round(duration)
      );

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      requestLogger.logError(error, {
        route: pathname,
        action: `${method} request`,
      });

      // Return error response
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Internal server error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Health check endpoint response
 */
export function healthCheck(): NextResponse {
  logger.info('Health check');
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Metrics endpoint response
 */
export function metricsResponse(): NextResponse {
  const metrics = requestLogger.getSessionMetrics();
  return NextResponse.json(metrics);
}

export default {
  withLogging,
  healthCheck,
  metricsResponse,
};
