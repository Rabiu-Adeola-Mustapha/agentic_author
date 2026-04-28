import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { OutputModel } from '@/lib/db/models/Output';
import { EvaluationModel } from '@/lib/db/models/Evaluation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await connectDB();

    const { id: projectId } = await params;
    
    // Using lean() for faster read operations
    const project = await ProjectModel.findOne({ 
      _id: projectId, 
      userId: session.user?.id, 
      deleted: false 
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If project is completed, fetch output and evaluation
    let output = null;
    let evaluation = null;

    if (project.status === 'completed' || project.status === 'failed') {
      output = await OutputModel.findOne({ projectId }).lean();
      evaluation = await EvaluationModel.findOne({ projectId }).lean();
    }

    return NextResponse.json({
      project,
      output,
      evaluation,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await connectDB();

    const { id: projectId } = await params;
    
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
    }

    const updatedProject = await ProjectModel.findOneAndUpdate(
      { _id: projectId, userId: session.user?.id, deleted: false },
      { title: title.trim() },
      { new: true }
    ).lean();

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
