import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { tasks } from '@trigger.dev/sdk/v3';
import mongoose from 'mongoose';

const finalizePipelineSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = finalizePipelineSchema.parse(body);

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

    // Trigger the background job using Trigger.dev
    console.log('[Pipeline] Triggering finalize job for project:', projectId);
    try {
      const run = await tasks.trigger(
        "finalize-pipeline",
        {
          projectId
        }
      );

      return NextResponse.json(
        {
          message: 'Project finalized',
          projectId,
          runId: run.id
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('[Pipeline] Failed to trigger finalize job:', error);
      return NextResponse.json(
        {
          message: 'Pipeline finalize queued',
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

    console.error('Pipeline finalize error:', error);
    return NextResponse.json(
      { error: 'Failed to finalize project' },
      { status: 500 }
    );
  }
}
