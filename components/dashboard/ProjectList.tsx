'use client';

import { useState } from 'react';
import { ProjectCard } from './ProjectCard';
import { FolderPlus } from 'lucide-react';
import Link from 'next/link';

interface ProjectListProps {
  initialProjects: any[];
}

type FilterType = 'all' | 'running' | 'completed';

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p._id !== id));
  };

  if (projects.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50">
        <FolderPlus className="mb-4 h-12 w-12 text-zinc-600" />
        <h3 className="mb-2 text-xl font-medium text-zinc-300">No projects yet</h3>
        <p className="mb-6 text-zinc-500">Create your first project to get started with Agentic Author.</p>
        <Link
          href="/dashboard/projects/new"
          className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
        >
          Create New Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        {(['all', 'running', 'completed'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30">
          <p className="text-zinc-500">No projects found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
