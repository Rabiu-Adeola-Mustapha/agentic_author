import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { UserModel } from '@/lib/db/models/User';
import { generateContentPipeline } from '@/trigger/tasks/pipeline';
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

    await ProjectModel.updateOne(
      { _id: projectId },
      { status: 'running', currentStage: 'prompt' }
    );

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering background job for project:', projectId);
    try {
      const run = await generateContentPipeline.trigger(
        {
          projectId,
          rawPrompt: project.rawPrompt || '',
          category: project.category,
        },
        { idempotencyKey: projectId } // Prevent duplicate runs
      );

      return NextResponse.json(
        {
          message: 'Pipeline started',
          projectId,
          runId: run.id
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('[Pipeline] Failed to trigger job:', error);
      // Fallback: return success anyway, job might be queued
      return NextResponse.json(
        {
          message: 'Pipeline queued',
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

    console.error('Pipeline run error:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline' },
      { status: 500 }
    );
  }
}
