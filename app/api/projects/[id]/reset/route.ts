import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import mongoose from 'mongoose';

/**
 * POST /api/projects/[id]/reset
 * Resets a stuck or failed project back to 'draft' state so it can be re-run.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    await connectDB();

    const project = await ProjectModel.findOneAndUpdate(
      {
        _id: projectId,
        userId: session.user.id,
        // Only allow resetting non-completed projects
        status: { $in: ['running', 'failed', 'awaiting_approval', 'draft'] },
      },
      {
        $set: {
          status: 'draft',
          currentStage: 'idle',
        },
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or cannot be reset' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Project reset successfully',
      status: project.status,
      currentStage: project.currentStage,
    });
  } catch (error) {
    console.error('Project reset error:', error);
    return NextResponse.json({ error: 'Failed to reset project' }, { status: 500 });
  }
}
