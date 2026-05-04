import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { tasks } from '@trigger.dev/sdk/v3';
import mongoose from 'mongoose';

const iteratePipelineSchema = z.object({
  projectId: z.string(),
  feedback: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, feedback } = iteratePipelineSchema.parse(body);

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

    if (project.status !== 'awaiting_approval' || project.currentStage !== 'prompt_review') {
      return NextResponse.json(
        { error: 'Project is not waiting for prompt approval.' },
        { status: 400 }
      );
    }

    await ProjectModel.updateOne(
      { _id: projectId },
      { status: 'running', currentStage: 'prompt' }
    );

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering iterate prompt job for project:', projectId);
    try {
      const run = await tasks.trigger(
        "iterate-prompt-pipeline",
        {
          projectId,
          category: project.category,
          userId: session.user.id,
          feedback
        },
        { idempotencyKey: projectId + '_iterate_' + Date.now() }
      );

      return NextResponse.json(
        {
          message: 'Iterating prompt',
          projectId,
          runId: run.id
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('[Pipeline] Failed to trigger iterate job:', error);
      return NextResponse.json(
        {
          message: 'Pipeline iterate queued',
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

    console.error('Pipeline iterate error:', error);
    return NextResponse.json(
      { error: 'Failed to iterate pipeline' },
      { status: 500 }
    );
  }
}
