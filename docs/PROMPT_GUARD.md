# Prompt Guard System Documentation

## Overview

The Prompt Guard system provides comprehensive security checks for user inputs, detecting and mitigating:

- **Prompt Injection Attacks** - Attempts to override system instructions
- **Jailbreak Attempts** - Trying to make the model behave in unintended ways
- **SQL/Command Injection** - Database and OS command exploitation attempts
- **Prompt Truncation** - Enforcing maximum prompt length limits
- **Malicious Patterns** - XXE, script injection, and other attack vectors

## Architecture

### Three-Tier Defense System

```
User Input
    ↓
1. Regex Pattern Detection (Fast) ← Basic injection patterns
    ↓
2. Claude AI Analysis (Medium) ← Semantic understanding
    ↓
3. Llama Guard Analysis (Optional) ← Specialized safety model
    ↓
Sanitized Safe Prompt
```

## Components

### 1. **prompt-guard.ts** - Primary Guard

Uses Claude 3.5 Sonnet to analyze prompts for security threats.

**Features:**

- Pattern-based detection (regex)
- AI-powered semantic analysis
- Automatic truncation at 8000 characters
- Sentence-boundary aware truncation

**Usage:**

```typescript
import {
  guardPrompt,
  sanitizePromptWithGuard,
} from "@/lib/guardrails/prompt-guard";

// Check prompt for threats
const result = await guardPrompt(userPrompt);
console.log(result.isClean); // boolean
console.log(result.threats); // string[]
console.log(result.truncated); // boolean

// Sanitize prompt by removing threats
const cleanPrompt = await sanitizePromptWithGuard(userPrompt);
```

### 2. **llama-guard.ts** - Advanced Safety (Optional)

Integrates Llama Guard model via OpenRouter API for specialized safety classification.

**Features:**

- Cloud-based via OpenRouter (no local setup required)
- 7 safety categories
- Risk level classification
- Batch analysis support
- Access to multiple safety models

**Requirements:**

- OpenRouter API key (free account with $5 credits)

**Setup OpenRouter:**

```bash
# 1. Sign up at https://openrouter.io
# 2. Get API key from https://openrouter.io/keys
```

**Configuration (.env):**

```bash
# OpenRouter API
OPENROUTER_API_KEY=your_api_key_here
LLAMA_GUARD_ENDPOINT=https://openrouter.io/api/v1/chat/completions
LLAMA_GUARD_MODEL=meta-llama/llama-guard-7b

# Alternative models available:
# - meta-llama/llama-guard-7b
# - meta-llama/llama-2-7b-chat
# - mistralai/mistral-7b-instruct
```

**Usage:**

```typescript
import {
  analyzeWithLlamaGuard,
  isLlamaGuardAvailable,
} from "@/lib/guardrails/llama-guard";

// Check availability
const available = await isLlamaGuardAvailable();

// Analyze with Llama Guard
const result = await analyzeWithLlamaGuard(prompt);
console.log(result.isUnsafe); // boolean
console.log(result.riskLevel); // 'safe' | 'low' | 'medium' | 'high'
console.log(result.violationCategories); // string[]
```

### 3. **security-check.ts** - Unified Interface

Combines all guards into a single comprehensive check.

**Core Functions:**

```typescript
import {
  performSecurityCheck,
  isPromptSafeToProcess,
  guardedPromptMiddleware,
} from "@/lib/guardrails/security-check";

// Full security check
const result = await performSecurityCheck(prompt);
// Returns:
// {
//   isApproved: boolean,
//   method: 'claude' | 'llama-guard' | 'hybrid',
//   threats: string[],
//   truncated: boolean,
//   sanitizedPrompt: string,
//   riskLevel: 'safe' | 'low' | 'medium' | 'high'
// }

// Check if safe to process (allows up to medium risk)
const { safe, result } = await isPromptSafeToProcess(prompt);

// Middleware for API routes
const guarded = await guardedPromptMiddleware(prompt, {
  throwOnUnsafe: true, // Throw on high risk
  sanitize: true, // Return sanitized version
  maxRiskLevel: "medium", // Allow up to medium risk
});
```

## Integration Points

### 1. **Pipeline Integration** ✅

Automatically checks prompts in the main content pipeline:

```typescript
// In lib/orchestrator/pipeline.ts
const securityResult = await guardedPromptMiddleware(rawPrompt, {
  throwOnUnsafe: false,
  sanitize: true,
  maxRiskLevel: "medium",
});

const safePrompt = securityResult.processed;
// Use safePrompt for content generation
```

### 2. **API Endpoint** ✅

Test or integrate via REST API:

```bash
# Check prompt security
curl -X POST http://localhost:3000/api/guardrails/check \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Your user prompt here",
    "mode": "check"  # or "safe-to-process" or "status"
  }'

# Response example:
{
  "success": true,
  "isApproved": true,
  "riskLevel": "safe",
  "method": "hybrid",
  "threats": [],
  "truncated": false,
  "sanitizedPrompt": "Your user prompt here"
}
```

### 3. **Custom Integration**

For specific API routes:

```typescript
// In your API route
import { guardedPromptMiddleware } from "@/lib/guardrails/security-check";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Guard the prompt
  const guarded = await guardedPromptMiddleware(body.prompt, {
    throwOnUnsafe: true,
    sanitize: true,
  });

  // Use sanitized prompt
  const safePrompt = guarded.processed;

  // Continue with your logic...
}
```

## Threat Detection Patterns

### Detected Injection Patterns:

1. **Instruction Override**
   - "ignore instructions"
   - "disregard system"
   - "forget rules"

2. **Role/Identity Hijacking**
   - "you are now"
   - "you are a hacker"
   - "act as an admin"

3. **Prompt Leakage**
   - "[SYSTEM]", "[ADMIN]" tags
   - "system prompt override"

4. **SQL Injection**
   - Single quotes, comments (--; /\*)
   - Stored procedures (xp*, sp*)

5. **Command Injection**
   - Pipe operators (|, ||)
   - Command substitution ($(), ``)
   - Redirects (&, &&)

6. **XML/XXE Attacks**
   - Entity declarations
   - File system access

## Configuration

### Environment Variables

```bash
# Claude API (Required)
ANTHROPIC_API_KEY=your_anthropic_key

# Llama Guard (Optional)
LLAMA_GUARD_ENDPOINT=http://localhost:11434
LLAMA_GUARD_MODEL=llama-guard

# Or for Hugging Face:
LLAMA_GUARD_ENDPOINT=https://api-inference.huggingface.co/models/...
LLAMA_GUARD_API_KEY=your_hf_token
```

### Tuning Configuration

Edit `lib/guardrails/prompt-guard.ts` CONFIG object:

```typescript
const CONFIG = {
  MAX_PROMPT_LENGTH: 8000, // Max characters
  TRUNCATION_WARNING_THRESHOLD: 0.8, // 80% warning
  DANGEROUS_PATTERNS: [
    /* ... */
  ], // Add custom patterns
};
```

## Response Codes

### API Response Status:

- **200** - Prompt approved
- **400** - Invalid request
- **500** - Security check failed

### Risk Levels:

- **safe** - No threats detected
- **low** - Minor injection patterns detected
- **medium** - Multiple threats or concerning patterns
- **high** - Critical threats or unsafe content

## Best Practices

1. **Always Sanitize** - Use `sanitizePromptWithGuard()` for user inputs
2. **Log Threats** - Monitor security logs for attack patterns
3. **Threshold Tuning** - Adjust `maxRiskLevel` based on your use case
4. **Async/Await** - All guards are async, use proper error handling
5. **Rate Limiting** - Consider rate limits on security check endpoints
6. **User Feedback** - Inform users why their prompt was rejected

## Monitoring & Debugging

### Enable Debug Logging:

```typescript
// In your code
const result = await performSecurityCheck(prompt);

if (!result.isApproved) {
  console.warn("Security Check Failed:", {
    threats: result.threats,
    method: result.method,
    riskLevel: result.riskLevel,
  });
}
```

### Check System Status:

```bash
curl http://localhost:3000/api/guardrails/check \
  -d '{"mode": "status"}' \
  -H "Content-Type: application/json" \
  -X POST

# Response:
{
  "success": true,
  "systems": {
    "claude": true,
    "llamaGuard": true
  }
}
```

## Performance Considerations

- **Pattern Matching**: ~1ms (fast)
- **Claude Analysis**: ~500-1000ms (medium)
- **Llama Guard (OpenRouter)**: ~500-2000ms (cloud-based)
- **Total**: ~1-3s for full security check

### Optimization Tips:

1. Cache results for identical prompts
2. Use sampling for Llama Guard (not every request)
3. Parallelize checks when possible
4. OpenRouter provides free tier with $5 credits for testing

## Troubleshooting

### Issue: "Claude API error"

**Solution**: Verify `ANTHROPIC_API_KEY` in `.env`

### Issue: "Llama Guard not available"

**Solution**:

- Verify `OPENROUTER_API_KEY` is set and valid
- Check endpoint: `https://openrouter.io/api/v1/chat/completions`
- Confirm model: `meta-llama/llama-guard-7b`
- Check credits at https://openrouter.io

### Issue: OpenRouter rate limit exceeded

**Solution**:

- Get more credits on https://openrouter.io
- Use sampling (not every request)
- Implement request queuing

### Issue: Prompts being over-truncated

**Solution**: Increase `MAX_PROMPT_LENGTH` in CONFIG

### Issue: Too many false positives

**Solution**: Adjust pattern list or increase `maxRiskLevel` threshold

## Future Enhancements

- [ ] Custom pattern rules per user/project
- [ ] Threat scoring system
- [ ] User education on detected threats
- [ ] Threat analytics dashboard
- [ ] Integration with WAF (Web Application Firewall)
- [ ] Multiple OpenRouter model switching
