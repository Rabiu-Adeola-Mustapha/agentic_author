/**
 * EXAMPLE USAGE - Winston Logging & OpenAI Monitoring
 *
 * This file shows how to use the logging system in real scenarios.
 * DO NOT commit this file - use it as a reference when implementing logging
 */

import logger from './logger';
import AIMonitor from './openai-monitoring';
import requestLogger from './request-logger';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// EXAMPLE 1: Simple API Route with Logging
// ============================================

export async function exampleAPIRoute(request: NextRequest) {
  const startTime = performance.now();
  const userId = 'user-123';

  try {
    // Log the incoming request
    requestLogger.logRequest('POST', '/api/create-project');

    // Simulate your API logic
    const projectData = await simulateProjectCreation();

    const duration = performance.now() - startTime;

    // Log successful response
    requestLogger.logResponse(
      'POST',
      '/api/create-project',
      201,
      Math.round(duration),
      userId
    );

    return NextResponse.json(projectData, { status: 201 });
  } catch (error) {
    // Log the error
    requestLogger.logError(error, {
      route: '/api/create-project',
      userId,
      action: 'create project',
    });

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// ============================================
// EXAMPLE 2: Agent Execution with Monitoring
// ============================================

export async function exampleAgentExecution() {
  // The BaseAgent class automatically logs token usage!
  // But you can also use trackAgentExecution for custom operations

  const result = await requestLogger.trackAgentExecution('CustomAgent', async () => {
    // Your agent logic here
    return { content: 'Generated content', tokens: 1000 };
  });

  // Automatically logged with duration!
  return result;
}

// ============================================
// EXAMPLE 3: Database Operation Logging
// ============================================

export async function exampleDatabaseOperation() {
  const startTime = performance.now();

  try {
    // Simulate database query
    // const user = await UserModel.findById('123');

    const duration = performance.now() - startTime;

    // Log the database operation
    requestLogger.logDatabase('read', 'User', Math.round(duration), true);

    logger.debug('User retrieved successfully', {
      userId: '123',
      duration: `${Math.round(duration)}ms`,
    });
  } catch (error) {
    const duration = performance.now() - startTime;

    requestLogger.logDatabase(
      'read',
      'User',
      Math.round(duration),
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    logger.error('Failed to retrieve user', {
      userId: '123',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================
// EXAMPLE 4: Complex Pipeline with Full Logging
// ============================================

export async function exampleComplexPipeline(projectId: string, userId: string) {
  const pipelineStartTime = performance.now();

  try {
    logger.info('Starting pipeline execution', {
      projectId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Planning
    const planStartTime = performance.now();
    const planResult = await requestLogger.trackAgentExecution('Planner', async () => {
      // Simulate planner agent
      return { plan: 'content plan', stage: 'planning' };
    });
    const planDuration = performance.now() - planStartTime;

    logger.debug('Planning stage completed', {
      projectId,
      duration: `${Math.round(planDuration)}ms`,
    });

    // Step 2: Research
    const researchStartTime = performance.now();
    const researchResult = await requestLogger.trackAgentExecution(
      'Researcher',
      async () => {
        // Simulate researcher agent
        return { research: 'research data', stage: 'research' };
      }
    );
    const researchDuration = performance.now() - researchStartTime;

    logger.debug('Research stage completed', {
      projectId,
      duration: `${Math.round(researchDuration)}ms`,
    });

    // Step 3: Writing
    const writeStartTime = performance.now();
    const writeResult = await requestLogger.trackAgentExecution('Writer', async () => {
      // Simulate writer agent
      return { content: 'written content', stage: 'writing' };
    });
    const writeDuration = performance.now() - writeStartTime;

    logger.debug('Writing stage completed', {
      projectId,
      duration: `${Math.round(writeDuration)}ms`,
    });

    const totalDuration = performance.now() - pipelineStartTime;

    // Get session metrics
    const metrics = AIMonitor.getSessionSummary();

    logger.info('Pipeline completed successfully', {
      projectId,
      userId,
      totalDuration: `${Math.round(totalDuration)}ms`,
      stages: 3,
      totalTokens: metrics.totalTokens,
      totalCost: `$${metrics.totalCost}`,
      successRate: `${Math.round((metrics.successfulCalls / metrics.totalCalls) * 100)}%`,
    });

    return {
      success: true,
      projectId,
      metrics,
      results: { planResult, researchResult, writeResult },
    };
  } catch (error) {
    const totalDuration = performance.now() - pipelineStartTime;

    logger.error('Pipeline execution failed', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(totalDuration)}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

// ============================================
// EXAMPLE 5: Manual OpenAI Monitoring
// ============================================

export async function exampleManualMonitoring() {
  // Wrap any async operation with monitoring
  const result = await AIMonitor.withMonitoring(
    'CustomOperation',
    'gpt-4',
    async () => {
      // Your API call here
      // const response = await openai.chat.completions.create(...)

      // Return result and usage
      return {
        result: { content: 'Generated content' },
        usage: {
          prompt_tokens: 100,
          completion_tokens: 150,
          total_tokens: 250,
        },
      };
    }
  );

  // Automatically logged with cost calculation!
  return result;
}

// ============================================
// EXAMPLE 6: Error Handling with Context
// ============================================

export async function exampleErrorHandling(userId: string) {
  try {
    // Your operation that might fail
    throw new Error('Something went wrong');
  } catch (error) {
    requestLogger.logError(error, {
      route: '/api/some-endpoint',
      userId,
      action: 'process data',
      metadata: {
        dataSize: 1000,
        retryCount: 2,
        timeout: 30000,
      },
    });

    // The error is now logged with full context
    // Check logs/error.log for the error with stack trace
  }
}

// ============================================
// EXAMPLE 7: Getting Session Metrics
// ============================================

export async function exampleGetMetrics() {
  // Get current session metrics
  const summary = AIMonitor.getSessionSummary();

  logger.info('Current session metrics', {
    totalCalls: summary.totalCalls,
    totalTokens: summary.totalTokens,
    totalCost: `$${summary.totalCost}`,
    averageTokensPerCall: summary.averageTokensPerCall,
    averageCostPerCall: `$${summary.averageCostPerCall}`,
  });

  // Print to console (useful for debugging)
  console.log('Session Summary:', summary);

  // Return metrics for API response
  return summary;
}

// ============================================
// EXAMPLE 8: Logging Different Levels
// ============================================

export function exampleLogLevels() {
  // ERROR - Something serious went wrong
  logger.error('Database connection failed', {
    host: 'db.example.com',
    port: 5432,
    code: 'ECONNREFUSED',
  });

  // WARN - Something unexpected but recoverable
  logger.warn('High memory usage detected', {
    currentUsage: '85%',
    threshold: '80%',
  });

  // INFO - General information
  logger.info('User logged in', {
    userId: '123',
    loginMethod: 'google',
    ipAddress: '192.168.1.1',
  });

  // DEBUG - Detailed debug information (dev only)
  logger.debug('Processing user data', {
    userId: '123',
    fields: ['name', 'email', 'profile'],
  });

  // TRACE - Very detailed trace (dev only)
  logger.trace('Function execution step', {
    function: 'calculateTotal',
    step: 1,
    value: 100,
  });
}

// ============================================
// HELPER FUNCTIONS (for examples)
// ============================================

async function simulateProjectCreation() {
  return {
    id: '123',
    name: 'New Project',
    createdAt: new Date(),
  };
}

// ============================================
// QUICK REFERENCE
// ============================================

/**
 * QUICK REFERENCE - Common Patterns
 *
 * 1. API Route:
 *    const start = performance.now();
 *    try {
 *      requestLogger.logRequest('POST', '/api/endpoint');
 *      // logic
 *      requestLogger.logResponse('POST', '/api/endpoint', 200, duration);
 *    } catch (e) {
 *      requestLogger.logError(e, { route: '/api/endpoint' });
 *    }
 *
 * 2. Agent Execution:
 *    const result = await requestLogger.trackAgentExecution('AgentName', () => agent.run());
 *
 * 3. Database Operation:
 *    requestLogger.logDatabase('read', 'User', duration, success, error);
 *
 * 4. Manual Monitoring:
 *    const result = await AIMonitor.withMonitoring('Agent', 'model', callback);
 *
 * 5. Get Metrics:
 *    const summary = AIMonitor.getSessionSummary();
 *
 * 6. Simple Logging:
 *    logger.info('Message', { context: 'data' });
 */

export default {
  exampleAPIRoute,
  exampleAgentExecution,
  exampleDatabaseOperation,
  exampleComplexPipeline,
  exampleManualMonitoring,
  exampleErrorHandling,
  exampleGetMetrics,
  exampleLogLevels,
};
