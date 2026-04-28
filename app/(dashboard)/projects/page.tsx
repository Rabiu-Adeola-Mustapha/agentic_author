import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { ProjectList } from '@/components/dashboard/ProjectList';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { serializeData } from '@/lib/utils';

export default async function ProjectsPage() {
  const session = await requireSession();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectDB();

  const allProjects = await ProjectModel.find({ 
    userId: session.user.id, 
    deleted: false 
  }).sort({ createdAt: -1 }).lean();

  const serializedProjects = serializeData(allProjects) as any[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sora text-3xl font-bold text-zinc-100">Projects</h1>
          <p className="mt-2 text-zinc-400">
            Manage your AI-generated documents and pipelines.
          </p>
        </div>
        
        {serializedProjects.length > 0 && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        )}
      </div>

      <ProjectList initialProjects={serializedProjects} />
    </div>
  );
}
