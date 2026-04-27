import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { ContentCategory } from '@/types';

const createProjectSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['book', 'screenplay', 'thesis', 'journal', 'educational']),
  rawPrompt: z.string().min(10),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const projects = await ProjectModel.find({ 
      userId: session.user.id,
      deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, rawPrompt } = createProjectSchema.parse(body);

    await connectDB();

    const project = await ProjectModel.create({
      userId: session.user.id,
      title,
      category: category as ContentCategory,
      status: 'draft',
      currentStage: 'idle',
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Projects POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
