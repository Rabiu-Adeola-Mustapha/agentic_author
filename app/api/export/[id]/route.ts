import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/options';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { OutputModel } from '@/lib/db/models/Output';
import { UserModel } from '@/lib/db/models/User';
import { generateDocx } from '@/lib/export/to-docx';
import { generatePdf } from '@/lib/export/to-pdf';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format');
    if (!format || !['pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use pdf or docx.' },
        { status: 400 }
      );
    }

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
    if (!user || user.subscription.plan !== 'pro') {
      return NextResponse.json(
        {
          error:
            'Export is only available for Pro users. Upgrade your subscription to export content.',
        },
        { status: 403 }
      );
    }

    if (!project.outputId) {
      return NextResponse.json(
        { error: 'Project output not found. Ensure generation is complete.' },
        { status: 404 }
      );
    }

    const output = await OutputModel.findById(project.outputId);
    if (!output) {
      return NextResponse.json(
        { error: 'Output not found' },
        { status: 404 }
      );
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'docx') {
      buffer = await generateDocx(project.title, {
        content: output.content,
        sections: output.sections,
        wordCount: output.wordCount,
      });
      contentType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${project.title}.docx`;
    } else {
      buffer = generatePdf(project.title, {
        content: output.content,
        sections: output.sections,
        wordCount: output.wordCount,
      });
      contentType = 'application/pdf';
      filename = `${project.title}.pdf`;
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    );
  }
}
