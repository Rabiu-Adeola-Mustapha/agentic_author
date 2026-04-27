import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

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
    }).lean();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: project.status,
        currentStage: project.currentStage,
        updatedAt: project.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Project status GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project status' },
      { status: 500 }
    );
  }
}
