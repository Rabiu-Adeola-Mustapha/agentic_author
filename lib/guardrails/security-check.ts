import { guardPrompt, sanitizePromptWithGuard } from "./prompt-guard";
import { isLlamaGuardAvailable, analyzeWithLlamaGuard } from "./llama-guard";

export interface SecurityCheckResult {
  isApproved: boolean;
  method: "claude" | "llama-guard" | "hybrid";
  threats: string[];
  truncated: boolean;
  sanitizedPrompt: string;
  riskLevel: "safe" | "low" | "medium" | "high";
}

/**
 * Comprehensive security check combining multiple methods
 */
export async function performSecurityCheck(
  prompt: string,
): Promise<SecurityCheckResult> {
  const threats: string[] = [];
  let riskLevel: "safe" | "low" | "medium" | "high" = "safe";
  let method: "claude" | "llama-guard" | "hybrid" = "claude";

  // Step 1: Quick check with Claude
  const claudeResult = await guardPrompt(prompt);
  threats.push(...claudeResult.threats);

  if (claudeResult.threats.length > 0) {
    riskLevel = claudeResult.threats.length > 2 ? "high" : "medium";
  }

  // Step 2: Optional deeper check with Llama Guard if available
  const llamaAvailable = await isLlamaGuardAvailable();
  if (llamaAvailable) {
    try {
      const llamaResult = await analyzeWithLlamaGuard(prompt);
      method = "hybrid";

      if (llamaResult.isUnsafe) {
        threats.push(...llamaResult.violationCategories);
        riskLevel = llamaResult.riskLevel;
      }
    } catch (error) {
      console.warn("Llama Guard analysis skipped:", error);
    }
  }

  // Step 3: Sanitize if threats detected
  let sanitizedPrompt = prompt;
  if (threats.length > 0) {
    sanitizedPrompt = await sanitizePromptWithGuard(prompt);
  }

  const isApproved = threats.length === 0 && riskLevel === "safe";

  return {
    isApproved,
    method,
    threats,
    truncated: claudeResult.truncated,
    sanitizedPrompt,
    riskLevel,
  };
}

/**
 * Check if prompt is safe enough to proceed
 * Allows proceeding with sanitized version if risk is low/medium
 */
export async function isPromptSafeToProcess(
  prompt: string,
  maxRiskLevel: "safe" | "low" | "medium" | "high" = "medium",
): Promise<{ safe: boolean; result: SecurityCheckResult }> {
  const result = await performSecurityCheck(prompt);

  const riskLevels = ["safe", "low", "medium", "high"];
  const isWithinThreshold =
    riskLevels.indexOf(result.riskLevel) <= riskLevels.indexOf(maxRiskLevel);

  return {
    safe: result.isApproved || isWithinThreshold,
    result,
  };
}

/**
 * Middleware for API routes to check incoming prompts
 */
export async function guardedPromptMiddleware(
  prompt: string,
  options: {
    throwOnUnsafe?: boolean;
    sanitize?: boolean;
    maxRiskLevel?: "safe" | "low" | "medium" | "high";
  } = {},
): Promise<{
  original: string;
  processed: string;
  result: SecurityCheckResult;
}> {
  const {
    throwOnUnsafe = true,
    sanitize = true,
    maxRiskLevel = "medium",
  } = options;

  const securityResult = await performSecurityCheck(prompt);

  if (!securityResult.isApproved) {
    if (throwOnUnsafe && securityResult.riskLevel === "high") {
      throw new Error(
        `Prompt rejected due to security concerns: ${securityResult.threats.join(", ")}`,
      );
    }

    if (securityResult.threats.length > 0) {
      console.warn(
        `Security threats detected in prompt:`,
        securityResult.threats,
      );
    }
  }

  const processedPrompt = sanitize ? securityResult.sanitizedPrompt : prompt;

  return {
    original: prompt,
    processed: processedPrompt,
    result: securityResult,
  };
}
