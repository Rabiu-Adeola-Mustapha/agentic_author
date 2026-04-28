import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { OutputModel } from '@/lib/db/models/Output';
import { z } from 'zod';

const updateOutputSchema = z.object({
  sections: z.array(z.object({
    key: z.string(),
    title: z.string(),
    content: z.string(),
    wordCount: z.number().optional(),
  })),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await connectDB();

    const { id: projectId } = await params;
    
    // Verify ownership
    const project = await ProjectModel.findOne({ _id: projectId, userId: session.user?.id, deleted: false });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateOutputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
    }

    const { sections } = result.data;

    // Recalculate word counts and total content
    let totalWordCount = 0;
    const fullContentLines: string[] = [];

    const updatedSections = sections.map(section => {
      const wordCount = section.content.trim().split(/\s+/).filter(Boolean).length;
      totalWordCount += wordCount;
      fullContentLines.push(`## ${section.title}\n\n${section.content}`);
      
      return {
        ...section,
        wordCount
      };
    });

    const newRawContent = fullContentLines.join('\n\n');

    // Update Output document
    const updatedOutput = await OutputModel.findOneAndUpdate(
      { projectId },
      { 
        sections: updatedSections,
        content: newRawContent,
        wordCount: totalWordCount,
      },
      { new: true }
    );

    if (!updatedOutput) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    return NextResponse.json(updatedOutput);

  } catch (error) {
    console.error('Error updating project output:', error);
    return NextResponse.json(
      { error: 'Failed to update output' },
      { status: 500 }
    );
  }
}
