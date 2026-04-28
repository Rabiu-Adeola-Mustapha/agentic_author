'use client';

import { useState, useRef, useEffect } from 'react';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { ProjectStatus, PipelineStage, ContentCategory } from '@/types';
import { ExportMenu } from './ExportMenu';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ProjectHeaderProps {
  projectId: string;
  initialTitle: string;
  category: string;
  status: ProjectStatus;
  currentStage: PipelineStage | 'idle' | 'done';
  userPlan: string;
}

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-zinc-500',
  running: 'bg-indigo-500 animate-pulse',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  running: 'Generating...',
  completed: 'Ready',
  failed: 'Failed',
};

export function ProjectHeader({ projectId, initialTitle, category, status, currentStage, userPlan }: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const config = CATEGORY_CONFIG[category as ContentCategory] || { icon: '📄', label: 'Document' };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveTitle = async () => {
    setIsEditing(false);
    if (title.trim() === '' || title === initialTitle) {
      setTitle(initialTitle);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update title');
      
      toast({ title: 'Title updated' });
    } catch (error) {
      toast({ 
        title: 'Error updating title', 
        description: 'Your changes could not be saved.',
        variant: 'destructive' 
      });
      setTitle(initialTitle);
    }
  };

  return (
    <div className="sticky top-14 z-30 flex w-full flex-col gap-4 border-b border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            <span>{config.icon}</span>
            {config.label}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <span className={cn('h-2 w-2 rounded-full', statusColors[status])} />
            {statusLabels[status]}
            {status === 'running' && currentStage && currentStage !== 'idle' && currentStage !== 'done' && (
              <span className="ml-1 text-zinc-500">({currentStage})</span>
            )}
          </span>
        </div>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setTitle(initialTitle);
                setIsEditing(false);
              }
            }}
            className="w-full bg-transparent font-sora text-xl font-bold text-zinc-100 outline-none border-b border-indigo-500 focus:ring-0"
          />
        ) : (
          <h1 
            onDoubleClick={() => setIsEditing(true)}
            className="cursor-text font-sora text-xl font-bold text-zinc-100 hover:text-indigo-100 transition-colors"
            title="Double-click to edit"
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {status === 'completed' && (
          <ExportMenu projectId={projectId} userPlan={userPlan} />
        )}
      </div>
    </div>
  );
}
