import { client } from "@/trigger.config";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { ProjectModel } from "@/lib/db/models/Project";

const pipelineSchema = z.object({
  projectId: z.string(),
  rawPrompt: z.string(),
  category: z.string(),
});

export const generateContentPipeline = client.defineJob({
  id: "generate-content-pipeline",
  name: "Generate Content Pipeline",
  version: "1.0.0",
  trigger: client.http({
    path: "/pipeline",
    method: "POST",
  }),
  run: async (payload, io, ctx) => {
    // Validate payload
    const data = pipelineSchema.parse(payload);
    const { projectId, rawPrompt, category } = data;

    try {
      await connectDB();

      // Stage 1: Generate Prompt
      await io.logger.info("Starting prompt generation...");
      await io.runTask(
        "prompt-generation",
        async () => {
          await ProjectModel.updateOne(
            { _id: projectId },
            { currentStage: "prompt", status: "running" }
          );
          // Call your prompt generation logic here
          // const prompt = await generatePrompt(rawPrompt, category);
          return { success: true };
        },
        { name: "Generate Prompt" }
      );

      // Stage 2: Create Plan
      await io.logger.info("Creating content plan...");
      await io.runTask(
        "plan-creation",
        async () => {
          await ProjectModel.updateOne(
            { _id: projectId },
            { currentStage: "plan" }
          );
          // Call your plan creation logic here
          // const plan = await createPlan(prompt, category);
          return { success: true };
        },
        { name: "Create Plan" }
      );

      // Stage 3: Web Research
      await io.logger.info("Conducting web research...");
      await io.runTask(
        "web-research",
        async () => {
          await ProjectModel.updateOne(
            { _id: projectId },
            { currentStage: "research" }
          );
          // Call your research logic here
          // const research = await conductResearch(prompt);
          return { success: true };
        },
        { name: "Web Research" }
      );

      // Stage 4: Content Writing
      await io.logger.info("Writing content...");
      await io.runTask(
        "content-writing",
        async () => {
          await ProjectModel.updateOne(
            { _id: projectId },
            { currentStage: "writing" }
          );
          // Call your content writing logic here
          // const content = await writeContent(prompt, plan, research);
          return { success: true };
        },
        { name: "Write Content" }
      );

      // Stage 5: Quality Evaluation
      await io.logger.info("Evaluating content quality...");
      await io.runTask(
        "quality-evaluation",
        async () => {
          await ProjectModel.updateOne(
            { _id: projectId },
            { currentStage: "evaluation" }
          );
          // Call your evaluation logic here
          // const evaluation = await evaluateContent(content);
          return { success: true };
        },
        { name: "Evaluate Content" }
      );

      // Mark as complete
      await ProjectModel.updateOne(
        { _id: projectId },
        {
          currentStage: "done",
          status: "completed",
          completedAt: new Date()
        }
      );

      await io.logger.info("Pipeline completed successfully");
      return { success: true, projectId };
    } catch (error) {
      await ProjectModel.updateOne(
        { _id: projectId },
        {
          status: "failed",
          currentStage: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      );

      throw error;
    }
  },
});
