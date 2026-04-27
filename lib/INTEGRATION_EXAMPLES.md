# Winston Logging & OpenAI Monitoring - Integration Examples

## Quick Integration Guide

### 1. Update API Routes

#### Before (Current):
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... logic ...
    console.error('[Pipeline Error]', error);
  } catch (error) {
    console.error('Pipeline run error:', error);
  }
}
```

#### After (With Logging):
```typescript
import logger from '@/lib/logger';
import requestLogger from '@/lib/request-logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const session = await auth();
  const userId = session?.user?.id;

  try {
    requestLogger.logRequest('POST', '/api/pipeline/run', undefined, userId);

    // ... logic ...

    const duration = performance.now() - startTime;
    requestLogger.logResponse('POST', '/api/pipeline/run', 202, Math.round(duration), userId);

    return NextResponse.json({ message: 'Pipeline started', projectId }, { status: 202 });
  } catch (error) {
    const duration = performance.now() - startTime;
    
    requestLogger.logError(error, {
      route: '/api/pipeline/run',
      userId,
      action: 'start pipeline',
      metadata: { projectId },
    });

    return NextResponse.json({ error: 'Failed to start pipeline' }, { status: 500 });
  }
}
```

### 2. Update Database Operations

#### Before:
```typescript
const project = await ProjectModel.findOne({
  _id: projectId,
  userId: session.user.id,
});
```

#### After:
```typescript
import requestLogger from '@/lib/request-logger';

const startTime = performance.now();
try {
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId: session.user.id,
  });
  
  const duration = performance.now() - startTime;
  requestLogger.logDatabase('read', 'Project', Math.round(duration), true);
} catch (error) {
  const duration = performance.now() - startTime;
  requestLogger.logDatabase('read', 'Project', Math.round(duration), false, error.message);
  throw error;
}
```

### 3. Agent Tracking (Already Automatic!)

The base agent already includes comprehensive logging. Just use the agent as normal:

```typescript
import { PlannerAgent } from '@/lib/agents/planner';

const planner = new PlannerAgent();
const result = await planner.run({
  topic: 'AI in Healthcare',
  category: 'book',
});

// Token usage, duration, and cost are automatically logged!
```

### 4. Add Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { metricsResponse } from '@/lib/api-middleware';

export async function GET() {
  return metricsResponse();
}
```

Now you can check metrics at: `GET /api/health`

### 5. Monitor Long-Running Operations

For pipeline orchestrator and similar operations:

```typescript
import logger from '@/lib/logger';
import requestLogger from '@/lib/request-logger';

export async function runPipeline(projectId: string, userId: string) {
  const startTime = performance.now();

  try {
    logger.info(`Starting pipeline: ${projectId}`);

    // Track agent execution with automatic logging
    const planResult = await requestLogger.trackAgentExecution('Planner', () =>
      planner.run(input)
    );

    const researchResult = await requestLogger.trackAgentExecution('Researcher', () =>
      researcher.run(input)
    );

    const writeResult = await requestLogger.trackAgentExecution('Writer', () =>
      writer.run(input)
    );

    const duration = performance.now() - startTime;
    logger.info(`Pipeline completed: ${projectId}`, {
      duration: `${Math.round(duration)}ms`,
      stages: 3,
      userId,
    });

    // Get session metrics
    const metrics = requestLogger.getSessionMetrics();
    logger.info('Pipeline metrics', {
      totalTokens: metrics.totalTokens,
      totalCost: `$${metrics.totalCost}`,
      successRate: `${Math.round((metrics.successfulCalls / metrics.totalCalls) * 100)}%`,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Pipeline failed: ${projectId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Math.round(duration)}ms`,
      userId,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
```

### 6. Add Logging to Payment Webhook

`app/api/payments/webhook/route.ts`:

```typescript
import logger from '@/lib/logger';
import requestLogger from '@/lib/request-logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const signature = request.headers.get('x-paystack-signature');

  try {
    logger.info('Payment webhook received', { signature: signature?.slice(0, 10) });

    // ... webhook verification ...

    const duration = performance.now() - startTime;
    requestLogger.logResponse('POST', '/api/payments/webhook', 200, Math.round(duration));

    return NextResponse.json({ success: true });
  } catch (error) {
    requestLogger.logError(error, {
      route: '/api/payments/webhook',
      action: 'process payment',
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

## Access Logs in Development

```bash
# Real-time combined logs
tail -f logs/combined.log

# Real-time AI usage (JSON format for processing)
tail -f logs/ai-usage.log

# View errors only
tail -f logs/error.log

# Count errors
grep -c "ERROR" logs/error.log

# Get specific agent logs
grep "Planner" logs/combined.log

# Pretty-print AI usage metrics
jq . logs/ai-usage.log
```

## Create Log Analysis Report

```bash
# Print report to console
npm run logs:analyze

# Save report to file
npm run logs:analyze:save
```

## Example Log Output

### Console (Development):
```
2024-01-15 10:30:45 [INFO]: POST /api/pipeline/run
2024-01-15 10:30:45 [DEBUG]: Executing agent: Planner
2024-01-15 10:30:47 [INFO]: OpenAI API Call
  agent: Planner
  model: grok-2
  promptTokens: 850
  completionTokens: 1200
  totalTokens: 2050
  duration: 2000ms
  estimatedCost: $0.012800
  success: true
```

### AI Usage Log (JSON):
```json
{
  "level": "ai-usage",
  "agent": "Planner",
  "model": "grok-2",
  "promptTokens": 850,
  "completionTokens": 1200,
  "totalTokens": 2050,
  "durationMs": 2000,
  "estimatedCostUSD": 0.0128,
  "success": true,
  "timestamp": "2024-01-15T10:30:47.123Z"
}
```

## Gradual Integration Strategy

1. **Start with base agents** - Already logging automatically ✅
2. **Add to payment webhook** - Simple and important
3. **Add to pipeline orchestrator** - Track complex operations
4. **Update main API routes** - `/api/projects`, `/api/export`, etc.
5. **Add database operation logging** - Query performance tracking
6. **Set up alerting** - Monitor for errors and high costs

## Key Metrics to Monitor

- **Daily token usage** - Track growth and budget
- **Cost per agent** - Identify expensive operations
- **Error rate** - Monitor reliability
- **API latency** - Track performance
- **Agent success rate** - Quality assurance

## Troubleshooting

**Logs not appearing:**
- Check that `logs/` directory was created
- Ensure no permission issues with file system
- Verify NODE_ENV is set (defaults to 'development')

**High costs:**
- Check top agents in AI usage report
- Verify token counts are expected
- Update MODEL_PRICING if using different models

**Missing token data:**
- Ensure OpenAI response includes `usage` field
- Check for API errors in error.log
- Verify model is in MODEL_PRICING

## Next Steps

1. Review and integrate examples above
2. Test with `npm run dev` and check logs
3. Set up log rotation policy (already configured: 5MB, 5-10 files)
4. Create monitoring dashboard (optional, using ai-usage.log)
5. Schedule regular log analysis reports
