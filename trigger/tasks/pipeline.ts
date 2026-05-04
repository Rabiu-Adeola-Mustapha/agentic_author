import { task, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { ProjectModel } from "@/lib/db/models/Project";
import { PromptWriter } from "@/lib/agents/prompt-writer";
import { Planner } from "@/lib/agents/planner";
import { Researcher } from "@/lib/agents/researcher";
import { Writer } from "@/lib/agents/writer";
import { Evaluator } from "@/lib/agents/evaluator";
import { sanitizePrompt } from "@/lib/guardrails/input-sanitizer";
import { ContentCategory } from "@/types";
import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

const generatePromptSchema = z.object({
  projectId: z.string(),
  rawPrompt: z.string(),
  category: z.string(),
  userId: z.string().optional(),
});

export const generateContentPipeline = task({
  id: "generate-content-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, rawPrompt, category, userId } = generatePromptSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      // Resolve valid userId from session or fall back to project owner
      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      logger.info("Project found", { projectId, userId: resolvedUserId });

      // Basic sanitization only — no external API calls for security check
      // (guardedPromptMiddleware makes 2 LLM calls and can hang indefinitely)
      const safePrompt = sanitizePrompt(rawPrompt);
      if (!safePrompt || safePrompt.trim().length === 0) {
        throw new Error("Prompt is empty after sanitization");
      }

      logger.info("Prompt sanitized, invoking PromptWriter...", { projectId });

      // Run PromptWriter
      const promptWriter = new PromptWriter();
      logger.info("Invoking PromptWriter...", { projectId });
      const promptResult = await promptWriter.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        rawInput: safePrompt,
      });

      if (!promptResult.success || !promptResult.data) {
        throw new Error(`PromptWriter failed: ${promptResult.error}`);
      }

      logger.info("PromptWriter succeeded, awaiting user approval", { projectId });

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "prompt_review", status: "awaiting_approval" }
      );

      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("generate-content-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

const continuePipelineSchema = z.object({
  projectId: z.string(),
  category: z.string(),
  userId: z.string().optional(),
});

export const generatePlanPipeline = task({
  id: "generate-plan-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, category, userId } = continuePipelineSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Continue task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "plan", status: "running" }
      );

      // Run Planner
      logger.info("Running Planner...", { projectId });
      const planner = new Planner();
      const planResult = await planner.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        promptId: project.promptId?.toString() || "",
      });
      if (!planResult.success || !planResult.data) {
        throw new Error(`Planner failed: ${planResult.error}`);
      }

      const updatedProject2 = await ProjectModel.findById(projectId);
      const planId = updatedProject2.planId?.toString() || "";
      logger.info("Planner done, awaiting approval", { projectId, planId });

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "plan_review", status: "awaiting_approval" }
      );

      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("generate-plan-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

export const generateResearchPipeline = task({
  id: "generate-research-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, category, userId } = continuePipelineSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Research task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "research", status: "running" }
      );

      const planId = project.planId?.toString() || "";

      // Run Researcher
      logger.info("Running Researcher...", { projectId });
      const researcher = new Researcher();
      const researchResult = await researcher.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        planId,
      });
      if (!researchResult.success || !researchResult.data) {
        throw new Error(`Researcher failed: ${researchResult.error}`);
      }

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "research_review", status: "awaiting_approval" }
      );

      logger.info("Researcher done, awaiting approval", { projectId });
      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("generate-research-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

export const executeWritingPipeline = task({
  id: "execute-writing-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, category, userId } = continuePipelineSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Writing task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "writing", status: "running" }
      );

      const researchId = project.researchId?.toString() || "";

      // Run Writer
      logger.info("Running Writer...", { projectId });
      const writer = new Writer();
      const writeResult = await writer.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        researchId,
      });
      if (!writeResult.success || !writeResult.data) {
        throw new Error(`Writer failed: ${writeResult.error}`);
      }

      const updatedProject4 = await ProjectModel.findById(projectId);
      const outputId = updatedProject4.outputId?.toString() || "";
      logger.info("Writer done", { projectId, outputId });

      // Run Evaluator
      logger.info("Running Evaluator...", { projectId });
      const evaluator = new Evaluator();
      const evaluateResult = await evaluator.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        outputId,
      });
      if (!evaluateResult.success) {
        throw new Error(`Evaluator failed: ${evaluateResult.error}`);
      }

      // Mark for evaluation review
      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "evaluation_review", status: "awaiting_approval" }
      );

      logger.info("Writing & Evaluation done, awaiting approval", { projectId });
      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("execute-writing-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

export const iterateResearchPipeline = task({
  id: "iterate-research-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, feedback, category, userId } = iteratePromptSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Iterate research task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "research", status: "running" }
      );

      // Run Researcher with feedback
      const researcher = new Researcher();
      const researchResult = await researcher.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        planId: project.planId?.toString() || "",
        feedback,
      });
      if (!researchResult.success) {
        throw new Error(`Researcher iteration failed: ${researchResult.error}`);
      }

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "research_review", status: "awaiting_approval" }
      );

      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("iterate-research-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

export const iterateWriterPipeline = task({
  id: "iterate-writer-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, feedback, category, userId } = iteratePromptSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Iterate writer task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "writing", status: "running" }
      );

      // Run Writer with feedback
      const writer = new Writer();
      const writeResult = await writer.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        researchId: project.researchId?.toString() || "",
        feedback,
      });
      if (!writeResult.success) {
        throw new Error(`Writer iteration failed: ${writeResult.error}`);
      }

      // Re-run Evaluator on the new output
      const outputId = project.outputId?.toString() || "";
      const evaluator = new Evaluator();
      const evaluateResult = await evaluator.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        outputId,
      });
      if (!evaluateResult.success) {
        throw new Error(`Evaluator failed: ${evaluateResult.error}`);
      }

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "evaluation_review", status: "awaiting_approval" }
      );

      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("iterate-writer-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

export const finalizePipeline = task({
  id: "finalize-pipeline",
  run: async (payload: { projectId: string }) => {
    await connectDB();
    await ProjectModel.updateOne(
      { _id: payload.projectId },
      { currentStage: "done", status: "completed" }
    );
    return { success: true };
  },
});


const iteratePromptSchema = z.object({
  projectId: z.string(),
  feedback: z.string(),
  category: z.string(),
  userId: z.string().optional(),
});

export const iteratePromptPipeline = task({
  id: "iterate-prompt-pipeline",
  maxDuration: 300,
  run: async (payload: any) => {
    const { projectId, feedback, category, userId } = iteratePromptSchema.parse(payload);
    const cat = category as ContentCategory;

    logger.info("Iterate prompt task started", { projectId, category });

    try {
      await connectDB();
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new Error("Project not found");

      const resolvedUserId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? userId
        : project.userId.toString();

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "prompt", status: "running" }
      );

      // We pass the feedback to PromptWriter
      // It handles fetching the previous prompt and generating the new one
      const promptWriter = new PromptWriter();
      const promptResult = await promptWriter.run({
        projectId,
        category: cat,
        userId: resolvedUserId,
        rawInput: project.rawPrompt || '', // It will also pull the latest prompt inside the agent
        feedback, // We will update the PromptWriter to accept this
      });

      if (!promptResult.success || !promptResult.data) {
        throw new Error(`PromptWriter failed: ${promptResult.error}`);
      }

      logger.info("PromptWriter iteration succeeded, awaiting user approval", { projectId });

      await ProjectModel.updateOne(
        { _id: projectId },
        { currentStage: "prompt_review", status: "awaiting_approval" }
      );

      return { success: true, projectId, status: "awaiting_approval" };
    } catch (error) {
      logger.error("iterate-prompt-pipeline failed", {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: "failed", currentStage: "failed" }
      );
      throw error;
    }
  },
});

