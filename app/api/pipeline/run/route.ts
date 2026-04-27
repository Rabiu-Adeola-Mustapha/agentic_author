import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { UserModel } from '@/lib/db/models/User';
import { PipelineOrchestrator } from '@/lib/orchestrator/pipeline';
import { ContentCategory } from '@/types';
import mongoose from 'mongoose';

const runPipelineSchema = z.object({
  projectId: z.string(),
  rawPrompt: z.string().min(10),
  category: z.enum(['book', 'screenplay', 'thesis', 'journal', 'educational']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, rawPrompt, category } = runPipelineSchema.parse(body);

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

    const limit = user.subscription.plan === 'pro' ? Infinity : 2;
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

    new PipelineOrchestrator()
      .run(projectId, session.user.id, rawPrompt, category as ContentCategory)
      .catch((error) => {
        console.error('[Pipeline Error]', error);
      });

    return NextResponse.json(
      { message: 'Pipeline started', projectId },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
