import { connectDB } from "@/lib/db/mongoose";
import { ProjectModel } from "@/lib/db/models/Project";
import { PromptWriter } from "@/lib/agents/prompt-writer";
import { Planner } from "@/lib/agents/planner";
import { Researcher } from "@/lib/agents/researcher";
import { Writer } from "@/lib/agents/writer";
import { Evaluator } from "@/lib/agents/evaluator";
import { ContentCategory } from "@/types";
import { guardedPromptMiddleware } from "@/lib/guardrails/security-check";

const TIMEOUT_MS = 300000; // 5 minutes

export class PipelineOrchestrator {
  async run(
    projectId: string,
    userId: string,
    rawPrompt: string,
    category: ContentCategory,
  ): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Pipeline execution timed out after 5 minutes"));
      }, TIMEOUT_MS);
    });

    try {
      return await Promise.race([
        this.executeSequence(projectId, userId, rawPrompt, category),
        timeoutPromise
      ]);
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

  private async checkDeleted(projectId: string): Promise<void> {
    await connectDB();
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.deleted) {
      throw new Error("Project was deleted, aborting pipeline.");
    }
  }

  private async executeSequence(
    projectId: string,
    userId: string,
    rawPrompt: string,
    category: ContentCategory,
  ): Promise<any> {
    await connectDB();

    const project = await ProjectModel.findOne({ _id: projectId, userId });
    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    console.log(`[Pipeline] Starting pipeline for project ${projectId} (${category})`);

    // Security Check: Guard against prompt injection and malicious input
    console.log(`[Pipeline] Running security checks...`);
    const securityResult = await guardedPromptMiddleware(rawPrompt, {
      throwOnUnsafe: false,
      sanitize: true,
      maxRiskLevel: "medium",
    });

    if (!securityResult.result.isApproved) {
      console.warn(`[Pipeline] Security warnings detected:`, securityResult.result.threats);
    }
    console.log(`[Pipeline] Security check completed. Risk level: ${securityResult.result.riskLevel}`);
    const safePrompt = securityResult.processed;

    let totalTokensUsed = 0;

    // Run PromptWriter
    await this.checkDeleted(projectId);
    console.log(`[Pipeline] Running PromptWriter...`);
    const promptWriter = new PromptWriter();
    const promptResult = await promptWriter.run({
      projectId,
      category,
      userId,
      rawInput: safePrompt,
    });
    if (!promptResult.success || !promptResult.data) {
      throw new Error(`PromptWriter failed: ${promptResult.error}`);
    }
    totalTokensUsed += promptResult.tokensUsed || 0;
    console.log(`[Pipeline] PromptWriter completed. Tokens used: ${promptResult.tokensUsed}`);
    const updatedProject1 = await ProjectModel.findById(projectId);
    const promptId = updatedProject1.promptId?.toString() || "";

    // Run Planner
    await this.checkDeleted(projectId);
    console.log(`[Pipeline] Running Planner...`);
    const planner = new Planner();
    const planResult = await planner.run({
      projectId,
      category,
      userId,
      promptId,
    });
    if (!planResult.success || !planResult.data) {
      throw new Error(`Planner failed: ${planResult.error}`);
    }
    totalTokensUsed += planResult.tokensUsed || 0;
    console.log(`[Pipeline] Planner completed. Tokens used: ${planResult.tokensUsed}`);
    const updatedProject2 = await ProjectModel.findById(projectId);
    const planId = updatedProject2.planId?.toString() || "";

    // Run Researcher
    await this.checkDeleted(projectId);
    console.log(`[Pipeline] Running Researcher...`);
    const researcher = new Researcher();
    const researchResult = await researcher.run({
      projectId,
      category,
      userId,
      planId,
    });
    if (!researchResult.success || !researchResult.data) {
      throw new Error(`Researcher failed: ${researchResult.error}`);
    }
    totalTokensUsed += researchResult.tokensUsed || 0;
    console.log(`[Pipeline] Researcher completed. Tokens used: ${researchResult.tokensUsed}`);
    const updatedProject3 = await ProjectModel.findById(projectId);
    const researchId = updatedProject3.researchId?.toString() || "";

    // Run Writer
    await this.checkDeleted(projectId);
    console.log(`[Pipeline] Running Writer...`);
    const writer = new Writer();
    const writeResult = await writer.run({
      projectId,
      category,
      userId,
      researchId,
    });
    if (!writeResult.success || !writeResult.data) {
      throw new Error(`Writer failed: ${writeResult.error}`);
    }
    totalTokensUsed += writeResult.tokensUsed || 0;
    console.log(`[Pipeline] Writer completed. Tokens used: ${writeResult.tokensUsed}`);
    const updatedProject4 = await ProjectModel.findById(projectId);
    const outputId = updatedProject4.outputId?.toString() || "";

    // Run Evaluator
    await this.checkDeleted(projectId);
    console.log(`[Pipeline] Running Evaluator...`);
    const evaluator = new Evaluator();
    const evaluateResult = await evaluator.run({
      projectId,
      category,
      userId,
      outputId,
    });
    if (!evaluateResult.success) {
      throw new Error(`Evaluator failed: ${evaluateResult.error}`);
    }
    totalTokensUsed += evaluateResult.tokensUsed || 0;
    console.log(`[Pipeline] Evaluator completed. Tokens used: ${evaluateResult.tokensUsed}`);
    console.log(`[Pipeline] All stages completed successfully. Total Tokens: ${totalTokensUsed}`);

    return evaluateResult.data;
  }
}
