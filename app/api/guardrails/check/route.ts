import { NextRequest, NextResponse } from "next/server";
import {
  performSecurityCheck,
  isPromptSafeToProcess,
} from "@/lib/guardrails/security-check";
import { isLlamaGuardAvailable } from "@/lib/guardrails/llama-guard";

export async function POST(request: NextRequest) {
  try {
    const { prompt, mode = "check" } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 },
      );
    }

    if (mode === "check") {
      // Full security check
      const result = await performSecurityCheck(prompt);
      return NextResponse.json({
        success: true,
        isApproved: result.isApproved,
        riskLevel: result.riskLevel,
        method: result.method,
        threats: result.threats,
        truncated: result.truncated,
        sanitizedPrompt: result.sanitizedPrompt,
      });
    } else if (mode === "safe-to-process") {
      // Check if safe to process (allows medium risk)
      const { safe, result } = await isPromptSafeToProcess(prompt, "medium");
      return NextResponse.json({
        success: true,
        safeToProcess: safe,
        riskLevel: result.riskLevel,
        threats: result.threats,
        sanitizedPrompt: result.sanitizedPrompt,
      });
    } else if (mode === "status") {
      // Check status of safety systems
      const llamaAvailable = await isLlamaGuardAvailable();
      return NextResponse.json({
        success: true,
        systems: {
          claude: true, // Always available
          llamaGuard: llamaAvailable,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Security check error:", error);
    return NextResponse.json(
      { error: "Security check failed", details: message },
      { status: 500 },
    );
  }
}
