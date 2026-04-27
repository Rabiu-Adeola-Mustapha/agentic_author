import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import logger from '@/lib/logger';
import AIMonitor from '@/lib/openai-monitoring';
import LogAnalyzer from '@/lib/log-analyzer';
import requestLogger from '@/lib/request-logger';

/**
 * GET /api/admin/metrics
 * Returns current session metrics and AI usage statistics
 * Admin only
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const session = await auth();

    // Check if user is admin (adjust based on your user model)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requestLogger.logRequest('GET', '/api/admin/metrics', undefined, session.user.id);

    // Get current session metrics
    const sessionMetrics = AIMonitor.getSessionSummary();

    // Get log analysis
    const analyzer = new LogAnalyzer();
    const aiUsage = await analyzer.analyzeAIUsage();
    const errors = await analyzer.analyzeErrors();

    const metrics = {
      timestamp: new Date().toISOString(),
      session: {
        totalCalls: sessionMetrics.totalCalls,
        successfulCalls: sessionMetrics.successfulCalls,
        failedCalls: sessionMetrics.failedCalls,
        totalTokens: sessionMetrics.totalTokens,
        totalCost: sessionMetrics.totalCost,
        averageTokensPerCall: sessionMetrics.averageTokensPerCall,
        averageCostPerCall: sessionMetrics.averageCostPerCall,
      },
      allTime: {
        totalCalls: aiUsage.totalCalls,
        totalTokens: aiUsage.totalTokens,
        totalCost: aiUsage.totalCost,
        averageTokensPerCall: aiUsage.averageTokensPerCall,
        averageCostPerCall: aiUsage.averageCostPerCall,
        modelBreakdown: aiUsage.modelBreakdown,
        agentBreakdown: aiUsage.agentBreakdown,
        topCostlyAgents: aiUsage.topCostlyAgents,
      },
      errors: {
        totalErrors: errors.totalErrors,
        errorsByType: errors.errorsByType,
      },
    };

    const duration = performance.now() - startTime;
    requestLogger.logResponse('GET', '/api/admin/metrics', 200, Math.round(duration), session.user.id);

    logger.debug('Admin metrics retrieved', {
      userId: session.user.id,
      duration: `${Math.round(duration)}ms`,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    requestLogger.logError(error, {
      route: '/api/admin/metrics',
      action: 'fetch metrics',
    });

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/metrics/reset
 * Reset session metrics (development/testing)
 * Admin only
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Cannot reset metrics in production' },
        { status: 403 }
      );
    }

    requestLogger.logRequest('POST', '/api/admin/metrics/reset', undefined, session.user.id);

    AIMonitor.resetMetrics();

    const duration = performance.now() - startTime;
    requestLogger.logResponse('POST', '/api/admin/metrics/reset', 200, Math.round(duration), session.user.id);

    logger.info('Session metrics reset', { userId: session.user.id });

    return NextResponse.json({ success: true, message: 'Metrics reset' });
  } catch (error) {
    requestLogger.logError(error, {
      route: '/api/admin/metrics/reset',
      action: 'reset metrics',
    });

    return NextResponse.json(
      { error: 'Failed to reset metrics' },
      { status: 500 }
    );
  }
}
