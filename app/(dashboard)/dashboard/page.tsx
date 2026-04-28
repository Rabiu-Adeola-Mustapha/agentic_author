import { requireSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongoose';
import { ProjectModel } from '@/lib/db/models/Project';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { FolderPlus, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serializeData } from '@/lib/utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const session = await requireSession();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectDB();
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Use lean() for performance and easy serialization
  const [allProjects, todayProjects] = await Promise.all([
    ProjectModel.find({ userId: session.user.id, deleted: false }).sort({ createdAt: -1 }).lean(),
    ProjectModel.find({ 
      userId: session.user.id, 
      deleted: false,
      createdAt: { $gte: startOfDay }
    }).lean()
  ]);

  const total = allProjects.length;
  const completed = allProjects.filter(p => p.status === 'completed').length;
  const running = allProjects.filter(p => p.status === 'running').length;
  const todayGenerationCount = todayProjects.length;

  const recentProjects = serializeData(allProjects.slice(0, 6)) as any[];

  // Get user name from email (before @)
  const name = session.user.email?.split('@')[0] || 'Author';
  const plan = (session.user as any).plan || 'free';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-3xl font-bold text-zinc-100">
          {getGreeting()}, {name}
        </h1>
        <p className="mt-2 text-zinc-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-indigo-500/10 p-3 text-indigo-400">
              <FolderPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Projects</p>
              <p className="text-2xl font-bold text-zinc-100">{total}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-emerald-500/10 p-3 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Completed</p>
              <p className="text-2xl font-bold text-zinc-100">{completed}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-amber-500/10 p-3 text-amber-400">
              <Loader2 className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Running</p>
              <p className="text-2xl font-bold text-zinc-100">{running}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-blue-500/10 p-3 text-blue-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Generated Today</p>
              <p className="text-2xl font-bold text-zinc-100">{todayGenerationCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sora text-xl font-semibold text-zinc-100">
              Recent Projects
            </h2>
            {total > 6 && (
              <Link href="/dashboard/projects" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                View all
              </Link>
            )}
          </div>
          
          {recentProjects.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50">
              <FolderPlus className="mb-4 h-10 w-10 text-zinc-600" />
              <h3 className="mb-1 text-lg font-medium text-zinc-300">No projects yet</h3>
              <p className="mb-4 text-sm text-zinc-500">Create your first project to get started.</p>
              <Link
                href="/dashboard/projects/new"
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
              >
                Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard 
                  key={project._id} 
                  project={project}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {plan === 'free' && (
            <>
              <h2 className="font-sora text-xl font-semibold text-zinc-100 mb-4">
                Usage
              </h2>
              <UsageStats dailyCount={todayGenerationCount} plan={plan} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
