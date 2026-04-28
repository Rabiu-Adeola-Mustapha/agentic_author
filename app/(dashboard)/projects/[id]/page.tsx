import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { OutputModel } from '@/lib/db/models/Output';
import { EvaluationModel } from '@/lib/db/models/Evaluation';
import { redirect } from 'next/navigation';
import { ProjectDetailClient } from '@/components/editor/ProjectDetailClient';
import { serializeData } from '@/lib/utils';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id: projectId } = await params;
  const session = await requireSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectDB();

  // Fetch project
  const project = await ProjectModel.findOne({ 
    _id: projectId, 
    userId: session.user.id, 
    deleted: false 
  }).lean();

  if (!project) {
    redirect('/dashboard/projects');
  }

  // Fetch output and evaluation if completed
  let output = null;
  let evaluation = null;

  if (project.status === 'completed' || project.status === 'failed') {
    output = await OutputModel.findOne({ projectId: project._id }).lean();
    evaluation = await EvaluationModel.findOne({ projectId: project._id }).lean();
  }

  // Serialize data for Client Component
  const serializedProject = serializeData(project);
  const serializedOutput = output ? serializeData(output) : null;
  const serializedEvaluation = evaluation ? serializeData(evaluation) : null;

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] flex-col bg-zinc-950">
      <ProjectDetailClient 
        initialProject={serializedProject as any}
        initialOutput={serializedOutput as any}
        initialEvaluation={serializedEvaluation as any}
        userPlan={(session.user as any).plan || 'free'}
      />
    </div>
  );
}
