import { connectDB } from "@/lib/db/mongoose";
import { ProjectModel } from "@/lib/db/models/Project";
import { PromptWriter } from "@/lib/agents/prompt-writer";
import { Planner } from "@/lib/agents/planner";
import { Researcher } from "@/lib/agents/researcher";
import { Writer } from "@/lib/agents/writer";
import { Evaluator } from "@/lib/agents/evaluator";
import { ContentCategory } from "@/types";
import { guardedPromptMiddleware } from "@/lib/guardrails/security-check";

export class PipelineOrchestrator {
  async run(
    projectId: string,
    userId: string,
    rawPrompt: string,
    category: ContentCategory,
  ): Promise<void> {
    try {
      await connectDB();

      const project = await ProjectModel.findOne({ _id: projectId, userId });
      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      console.log(
        `[Pipeline] Starting pipeline for project ${projectId} (${category})`,
      );

      // Security Check: Guard against prompt injection and malicious input
      console.log(`[Pipeline] Running security checks...`);
      const securityResult = await guardedPromptMiddleware(rawPrompt, {
        throwOnUnsafe: false,
        sanitize: true,
        maxRiskLevel: "medium",
      });

      if (!securityResult.result.isApproved) {
        console.warn(
          `[Pipeline] Security warnings detected:`,
          securityResult.result.threats,
        );
      }

      console.log(
        `[Pipeline] Security check completed. Risk level: ${securityResult.result.riskLevel}`,
      );

      const safePrompt = securityResult.processed;

      // Run PromptWriter
      console.log(`[Pipeline] Running PromptWriter...`);
      const promptWriter = new PromptWriter();
      const promptResult = await promptWriter.run({
        projectId: projectId,
        category: category,
        userId: userId,
        rawInput: safePrompt,
      });

      if (!promptResult.success || !promptResult.data) {
        throw new Error(`PromptWriter failed: ${promptResult.error}`);
      }

      console.log(
        `[Pipeline] PromptWriter completed. Tokens used: ${promptResult.tokensUsed}`,
      );

      const promptId = project.promptId?.toString() || "";

      // Run Planner
      console.log(`[Pipeline] Running Planner...`);
      const planner = new Planner();
      const planResult = await planner.run({
        projectId: projectId,
        category: category,
        userId: userId,
        promptId: promptId,
      });

      if (!planResult.success || !planResult.data) {
        throw new Error(`Planner failed: ${planResult.error}`);
      }

      console.log(
        `[Pipeline] Planner completed. Tokens used: ${planResult.tokensUsed}`,
      );

      const planId = project.planId?.toString() || "";

      // Run Researcher
      console.log(`[Pipeline] Running Researcher...`);
      const researcher = new Researcher();
      const researchResult = await researcher.run({
        projectId: projectId,
        category: category,
        userId: userId,
        planId: planId,
      });

      if (!researchResult.success || !researchResult.data) {
        throw new Error(`Researcher failed: ${researchResult.error}`);
      }

      console.log(
        `[Pipeline] Researcher completed. Tokens used: ${researchResult.tokensUsed}`,
      );

      const researchId = project.researchId?.toString() || "";

      // Run Writer
      console.log(`[Pipeline] Running Writer...`);
      const writer = new Writer();
      const writeResult = await writer.run({
        projectId: projectId,
        category: category,
        userId: userId,
        researchId: researchId,
      });

      if (!writeResult.success || !writeResult.data) {
        throw new Error(`Writer failed: ${writeResult.error}`);
      }

      console.log(
        `[Pipeline] Writer completed. Tokens used: ${writeResult.tokensUsed}`,
      );

      const outputId = project.outputId?.toString() || "";

      // Run Evaluator
      console.log(`[Pipeline] Running Evaluator...`);
      const evaluator = new Evaluator();
      const evaluateResult = await evaluator.run({
        projectId: projectId,
        category: category,
        userId: userId,
        outputId: outputId,
      });

      if (!evaluateResult.success) {
        throw new Error(`Evaluator failed: ${evaluateResult.error}`);
      }

      console.log(
        `[Pipeline] Evaluator completed. Tokens used: ${evaluateResult.tokensUsed}`,
      );
      console.log(
        `[Pipeline] All stages completed successfully for project ${projectId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Pipeline] Error: ${message}`);

      try {
        await connectDB();
        await ProjectModel.updateOne(
          { _id: projectId },
          { status: "failed", currentStage: "failed" },
        );
      } catch (updateError) {
        console.error("Failed to update project status:", updateError);
      }

      throw error;
    }
  }
}
