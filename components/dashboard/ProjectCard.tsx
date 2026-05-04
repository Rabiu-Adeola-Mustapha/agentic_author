'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, ArrowRight } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { ProjectStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface SerializedProject {
  _id: string;
  title: string;
  category: string;
  status: ProjectStatus;
  createdAt: string;
}

interface ProjectCardProps {
  project: SerializedProject;
  onDelete?: (id: string) => void;
}

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-zinc-500',
  running: 'bg-indigo-500 animate-pulse',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  awaiting_approval: 'bg-amber-500 animate-pulse',
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  running: 'Generating...',
  completed: 'Ready',
  failed: 'Failed',
  awaiting_approval: 'Action Required',
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const config = CATEGORY_CONFIG[project.category as keyof typeof CATEGORY_CONFIG] || {
    icon: '📄',
    label: 'Document',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/projects/${project._id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete project');
      
      if (onDelete) {
        onDelete(project._id);
      } else {
        // If no onDelete is provided (like on server-rendered dashboard), refresh
        window.location.reload();
      }
      
      toast({
        title: 'Project deleted',
        description: 'The project has been successfully removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not delete the project. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  return (
    <Link
      href={`/dashboard/projects/${project._id}`}
      className="group relative flex h-[180px] flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-all duration-150 hover:scale-[1.01] hover:bg-zinc-800"
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            <span>{config.icon}</span>
            {config.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <span className={cn('h-2 w-2 rounded-full', statusColors[project.status])} />
              {statusLabels[project.status]}
            </span>
          </div>
        </div>
        
        <h3 className="font-sora line-clamp-2 text-lg font-semibold text-zinc-100 group-hover:text-indigo-100">
          {project.title}
        </h3>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-zinc-500">
          {new Date(project.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        
        <div className="flex items-center gap-2">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 z-10 bg-zinc-900 px-2 py-1 rounded shadow-lg border border-zinc-700">
              <span className="text-xs font-medium text-zinc-300">Sure?</span>
              <button
                onClick={cancelDelete}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2"
                disabled={isDeleting}
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-300 px-2 font-bold flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="rounded p-1.5 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
              aria-label="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          
          <div className="flex items-center gap-1 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
            View <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
