import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { PromptModel } from '@/lib/db/models/Prompt';
import { PlanModel } from '@/lib/db/models/Plan';
import { ResearchModel } from '@/lib/db/models/Research';
import { OutputModel } from '@/lib/db/models/Output';
import { EvaluationModel } from '@/lib/db/models/Evaluation';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const project = await ProjectModel.findOne({
      _id: params.id,
      userId: session.user.id,
    }).lean();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectWithData: any = { ...project };

    if (project.promptId) {
      projectWithData.prompt = await PromptModel.findById(project.promptId).lean();
    }
    if (project.planId) {
      projectWithData.plan = await PlanModel.findById(project.planId).lean();
    }
    if (project.researchId) {
      projectWithData.research = await ResearchModel.findById(project.researchId).lean();
    }
    if (project.outputId) {
      projectWithData.output = await OutputModel.findById(project.outputId).lean();
    }
    if (project.evaluationId) {
      projectWithData.evaluation = await EvaluationModel.findById(project.evaluationId).lean();
    }

    return NextResponse.json(projectWithData, { status: 200 });
  } catch (error) {
    console.error('Project GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await ProjectModel.deleteOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Project DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
