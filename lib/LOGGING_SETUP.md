# Winston Logging & OpenAI Monitoring Setup

This guide explains how to use the integrated logging system with OpenAI SDK monitoring and token tracking.

## Files Created

1. **`lib/logger.ts`** - Main Winston logger configuration
2. **`lib/openai-monitoring.ts`** - OpenAI API monitoring and token tracking
3. **`lib/request-logger.ts`** - Utilities for HTTP request/response logging
4. **`lib/api-middleware.ts`** - Middleware wrapper for automatic API logging

## Quick Start

### Basic Logging

```typescript
import logger from '@/lib/logger';

// Different log levels
logger.error('Something went wrong', { errorCode: 123 });
logger.warn('This might be a problem');
logger.info('Operation completed', { duration: '100ms' });
logger.debug('Debug information', { metadata: true });
logger.trace('Detailed trace', { step: 1 });
```

### API Request/Response Logging

```typescript
import { NextRequest, NextResponse } from 'next/server';
import requestLogger from '@/lib/request-logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const userId = session?.user?.id;

  try {
    // Log incoming request
    requestLogger.logRequest('POST', '/api/projects', undefined, userId);

    // Your logic here
    const result = await someOperation();

    // Log successful response
    const duration = performance.now() - startTime;
    requestLogger.logResponse('POST', '/api/projects', 200, Math.round(duration), userId);

    return NextResponse.json(result);
  } catch (error) {
    requestLogger.logError(error, {
      route: '/api/projects',
      userId,
      action: 'create project',
    });

    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Tracking Agent Execution

The base agent automatically logs all OpenAI API calls with token tracking. You can also use it manually:

```typescript
import requestLogger from '@/lib/request-logger';

const result = await requestLogger.trackAgentExecution('Planner', async () => {
  return await planner.run(input);
});
```

### OpenAI Token Monitoring

The `AIMonitor` class automatically tracks:
- Prompt tokens
- Completion tokens
- Total tokens
- Estimated cost
- Tool executions
- API call duration
- Success/failure status

**Automatic tracking (in base agents):**
All agents inheriting from `BaseAgent` automatically log token usage.

**Manual tracking:**

```typescript
import AIMonitor from '@/lib/openai-monitoring';

// Track a single API call
AIMonitor.logTokenUsage(
  'AgentName',
  'grok-2',
  usage, // from OpenAI response
  durationMs,
  true // success
);

// Get session summary
const summary = AIMonitor.getSessionSummary();
console.log(summary);
// Output:
// {
//   totalCalls: 5,
//   successfulCalls: 5,
//   failedCalls: 0,
//   totalTokens: 2500,
//   totalCost: 0.025,
//   averageTokensPerCall: 500,
//   averageCostPerCall: 0.005,
//   metrics: [...]
// }
```

## Log Files

Logs are automatically written to the `logs/` directory:

- **`error.log`** - Only errors (for quick debugging)
- **`combined.log`** - All logs (comprehensive)
- **`ai-usage.log`** - JSON-formatted AI usage metrics (for analytics)
- **`exceptions.log`** - Uncaught exceptions

## Using with API Middleware (Optional)

For automatic request/response logging with less boilerplate:

```typescript
import { withLogging } from '@/lib/api-middleware';

async function handler(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ success: true });
}

export const POST = withLogging(handler, {
  logBody: true,  // Log request body
  logResponse: true, // Log response status
});
```

## Database Operation Logging

```typescript
import requestLogger from '@/lib/request-logger';

const startTime = performance.now();

try {
  const user = await UserModel.findById(id);
  const duration = performance.now() - startTime;
  
  requestLogger.logDatabase('read', 'User', Math.round(duration), true);
} catch (error) {
  const duration = performance.now() - startTime;
  requestLogger.logDatabase(
    'read',
    'User',
    Math.round(duration),
    false,
    error.message
  );
}
```

## Environment Variables

No additional environment variables are needed. The logger automatically:
- Detects `NODE_ENV` for development vs production
- Creates the `logs/` directory if it doesn't exist
- Uses timestamps in UTC

## Log Levels

The system uses 5 log levels (in order of severity):

1. **error** - Serious problems that need immediate attention
2. **warn** - Potential issues or unexpected conditions
3. **info** - General informational messages
4. **debug** - Detailed debug information (only in development)
5. **trace** - Very detailed trace information

## Token Cost Calculation

Supported models and their approximate pricing:

```typescript
{
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'grok-2': { input: 0.002, output: 0.01 },
}
```

Update `MODEL_PRICING` in `lib/openai-monitoring.ts` with current pricing.

## Example: Complete API Route with Logging

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import logger from '@/lib/logger';
import requestLogger from '@/lib/request-logger';

const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const userId = (await auth())?.user?.id;

  try {
    requestLogger.logRequest('POST', '/api/projects', undefined, userId);

    const body = await request.json();
    const { name, description } = createProjectSchema.parse(body);

    // Simulate database operation
    const duration = performance.now() - startTime;
    requestLogger.logDatabase('create', 'Project', Math.round(duration), true);

    const project = {
      id: '123',
      name,
      description,
      userId,
      createdAt: new Date(),
    };

    requestLogger.logResponse('POST', '/api/projects', 201, Math.round(duration), userId);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof z.ZodError) {
      requestLogger.logResponse('POST', '/api/projects', 400, Math.round(duration), userId, error as Error);
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    requestLogger.logError(error, {
      route: '/api/projects',
      userId,
      action: 'create project',
    });

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

## Viewing Logs

During development, logs appear in console and are written to files.

**View real-time logs:**
```bash
tail -f logs/combined.log
```

**View AI usage analytics:**
```bash
tail -f logs/ai-usage.log
```

**View only errors:**
```bash
tail -f logs/error.log
```

## Production Considerations

- Logs are rotated at 5MB with up to 5-10 previous files kept
- All timestamps are in UTC
- Sensitive data (passwords, API keys) should not be logged
- Use the `ai-usage.log` for billing and analytics
- Monitor `error.log` for issues in production

## Monitoring Token Usage

Check the AI usage log file for JSON-formatted metrics:

```bash
jq . logs/ai-usage.log | tail -20
```

Or get a session summary programmatically:

```typescript
import AIMonitor from '@/lib/openai-monitoring';

const summary = AIMonitor.getSessionSummary();
console.log(`Session Cost: $${summary.totalCost}`);
console.log(`Total Tokens: ${summary.totalTokens}`);
```
