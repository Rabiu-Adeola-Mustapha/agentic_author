import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { tasks } from '@trigger.dev/sdk/v3';
import mongoose from 'mongoose';

const executePipelineSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = executePipelineSchema.parse(body);

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

    await ProjectModel.updateOne(
      { _id: projectId },
      { status: 'running', currentStage: 'research' }
    );

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering research job for project:', projectId);
    try {
      const run = await tasks.trigger(
        "generate-research-pipeline",
        {
          projectId,
          category: project.category,
          userId: session.user.id,
        },
        { idempotencyKey: projectId + '_research_' + Date.now() }
      );

      return NextResponse.json(
        {
          message: 'Research starting',
          projectId,
          runId: run.id
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('[Pipeline] Failed to trigger research job:', error);
      return NextResponse.json(
        {
          message: 'Research queued',
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

    console.error('Pipeline research error:', error);
    return NextResponse.json(
      { error: 'Failed to start research' },
      { status: 500 }
    );
  }
}
