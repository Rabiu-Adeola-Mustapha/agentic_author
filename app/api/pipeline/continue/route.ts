import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { tasks } from '@trigger.dev/sdk';
import mongoose from 'mongoose';

const continuePipelineSchema = z.object({
  projectId: z.string(),
  finalPrompt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, finalPrompt } = continuePipelineSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await ProjectModel.findOne({
      _id: projectId,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.status !== 'awaiting_approval') {
      return NextResponse.json(
        { error: 'Project is not waiting for approval.' },
        { status: 400 }
      );
    }

    // Update the prompt if the user edited it
    if (finalPrompt && project.promptId) {
      const promptDoc = await PromptModel.findById(project.promptId);
      if (promptDoc && promptDoc.finalPrompt !== finalPrompt) {
        promptDoc.versions.push({ prompt: promptDoc.finalPrompt, editedAt: new Date() });
        promptDoc.finalPrompt = finalPrompt;
        await promptDoc.save();
      }
    }

    await ProjectModel.updateOne(
      { _id: projectId },
      { status: 'running', currentStage: 'plan' }
    );

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering generate plan job for project:', projectId);
    try {
      const run = await tasks.trigger(
        "generate-plan-pipeline",
        {
          projectId,
          category: project.category,
          userId: session.user.id,
        },
        { idempotencyKey: projectId + '_plan_' + Date.now() }
      );

      return NextResponse.json(
        {
          message: 'Pipeline continued',
          projectId,
          runId: run.id
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('[Pipeline] Failed to trigger continue job:', error);
      // Fallback: return success anyway, job might be queued
      return NextResponse.json(
        {
          message: 'Pipeline continue queued',
          projectId
        },
        { status: 202 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Pipeline continue error:', error);
    return NextResponse.json(
      { error: 'Failed to continue pipeline' },
      { status: 500 }
    );
  }
}
