import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { UserModel } from '@/lib/db/models/User';
import { tasks } from '@trigger.dev/sdk';
import mongoose from 'mongoose';

const runPipelineSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = runPipelineSchema.parse(body);

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

    if (!project.rawPrompt || project.rawPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project has no prompt. Please create the project with a valid prompt.' },
        { status: 400 }
      );
    }

    // Guard: don't re-trigger if already running
    if (project.status === 'running') {
      return NextResponse.json(
        { error: 'Pipeline is already running for this project.' },
        { status: 409 }
      );
    }

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const generationsToday = await ProjectModel.countDocuments({
      userId: session.user.id,
      createdAt: { $gte: today },
      status: { $in: ['running', 'completed'] },
    });

    const limit = (user as any).subscription?.plan === 'pro' ? Infinity : 2;
    if (generationsToday >= limit) {
      return NextResponse.json(
        {
          error:
            'Daily generation limit reached. Upgrade to Pro for unlimited access.',
        },
        { status: 429 }
      );
    }

    // Mark as running in DB
    await ProjectModel.updateOne(
      { _id: projectId },
      { status: 'running', currentStage: 'prompt' }
    );

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering background job for project:', projectId);
    try {
      const idempotencyKey = `${projectId}_prompt_${Date.now()}`;
      const run = await tasks.trigger(
        "generate-content-pipeline",
        {
          projectId,
          rawPrompt: project.rawPrompt || '',
          category: project.category,
          userId: session.user.id,
        },
        { idempotencyKey }
      );

      console.log('[Pipeline] Job triggered successfully, run ID:', run.id);
      return NextResponse.json(
        { message: 'Pipeline started', projectId, runId: run.id },
        { status: 202 }
      );
    } catch (error) {
      // Revert DB status if task triggering failed
      console.error('[Pipeline] Failed to trigger job, reverting DB status:', error);
      await ProjectModel.updateOne(
        { _id: projectId },
        { status: 'failed', currentStage: 'failed' }
      );
      return NextResponse.json(
        { error: 'Failed to start pipeline. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Pipeline run error:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline' },
      { status: 500 }
    );
  }
}
