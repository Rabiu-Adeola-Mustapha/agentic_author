'use client';

import { useEffect, useState } from 'react';
import { usePipelineStore } from '@/store/pipeline.store';
import { PipelineStage, ProjectStatus } from '@/types';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PipelineProgressProps {
  projectId: string;
  initialStatus: ProjectStatus;
}

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'prompt', label: 'Prompt Writer' },
  { id: 'plan', label: 'Planner' },
  { id: 'research', label: 'Researcher' },
  { id: 'writing', label: 'Writer' },
  { id: 'evaluation', label: 'Evaluator' },
];

export function PipelineProgress({ projectId, initialStatus }: PipelineProgressProps) {
  const { 
    status, 
    currentStage, 
    errorMessage, 
    startPolling, 
    stopPolling, 
    resetPipeline 
  } = usePipelineStore();
  
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // If the pipeline is running or draft, start polling
    // Actually, if it's draft, it might not be running yet, but we poll to catch the start
    if (initialStatus !== 'completed' && initialStatus !== 'failed') {
      startPolling(projectId);
    }
    
    return () => {
      stopPolling();
      resetPipeline();
    };
  }, [projectId, initialStatus, startPolling, stopPolling, resetPipeline]);

  const activeStatus = status === 'idle' ? initialStatus : status;

  const getStageState = (stageId: PipelineStage, index: number) => {
    if (activeStatus === 'completed' || currentStage === 'done') return 'completed';
    if (activeStatus === 'failed') {
      // If failed, all stages before current are completed, current is failed
      const currentIndex = STAGES.findIndex(s => s.id === currentStage);
      if (index < currentIndex) return 'completed';
      if (index === currentIndex) return 'failed';
      return 'pending';
    }
    
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex === -1) return 'pending'; // e.g. idle or draft
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        startPolling(projectId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
      <h3 className="mb-8 font-sora text-lg font-semibold text-zinc-100">Generation Progress</h3>
      
      <div className="relative space-y-0">
        {STAGES.map((stage, index) => {
          const state = getStageState(stage.id, index);
          const isLast = index === STAGES.length - 1;

          // Determine connector line color (from this stage to the next)
          let nextState = 'pending';
          if (!isLast) {
            nextState = getStageState(STAGES[index + 1].id, index + 1);
          }
          const isConnectorActive = state === 'completed' && (nextState === 'completed' || nextState === 'active' || nextState === 'failed');

          return (
            <div
              key={stage.id}
              className={cn(
                "relative flex items-start px-3 py-2 rounded-lg transition-all duration-300",
                state === 'active' && "bg-indigo-500/15 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
              )}
            >
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-4 top-10 -ml-px h-full w-0.5",
                    isConnectorActive ? "bg-indigo-500" : "bg-zinc-800"
                  )}
                />
              )}

              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950">
                {state === 'completed' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
                {state === 'active' && (
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <div className="absolute h-8 w-8 animate-pulse rounded-full bg-indigo-500/40" />
                    <div className="absolute h-10 w-10 animate-ping rounded-full border-2 border-indigo-500/40" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 ring-2 ring-indigo-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                {state === 'pending' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-700">
                    <div className="h-2 w-2 rounded-full bg-zinc-700" />
                  </div>
                )}
                {state === 'failed' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-500 ring-1 ring-red-500">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="ml-4 min-h-[4rem] pb-4 pt-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "font-medium",
                    state === 'active' ? "text-indigo-300 font-bold text-base" :
                    state === 'completed' ? "text-zinc-100" :
                    state === 'failed' ? "text-red-400" : "text-zinc-600"
                  )}>
                    {stage.label}
                  </p>
                  {state === 'active' && (
                    <span className="px-2 py-1 ml-2 text-xs font-semibold bg-indigo-500/30 text-indigo-300 rounded-full ring-1 ring-indigo-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>
                {state === 'completed' && (
                  <p className="text-sm text-zinc-500">Completed</p>
                )}
                {state === 'active' && (
                  <div className="flex items-center text-sm text-indigo-300/80 font-medium mt-1">
                    <span>Running</span>
                    <span className="ml-1 flex w-4">
                      <span className="animate-[bounce_1.4s_infinite] inline-block">.</span>
                      <span className="animate-[bounce_1.4s_infinite_0.2s] inline-block">.</span>
                      <span className="animate-[bounce_1.4s_infinite_0.4s] inline-block">.</span>
                    </span>
                  </div>
                )}
                {state === 'failed' && (
                  <p className="text-sm text-red-500">Error encountered</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeStatus === 'failed' && (
        <div className="mt-6 rounded-lg bg-red-500/10 p-4 border border-red-500/20">
          <h4 className="flex items-center text-sm font-semibold text-red-400">
            <AlertCircle className="mr-2 h-4 w-4" /> Pipeline Failed
          </h4>
          <p className="mt-2 text-sm text-red-300">{errorMessage || 'An unknown error occurred during generation.'}</p>
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Try Again
          </Button>
        </div>
      )}

      {activeStatus === 'completed' && (
        <div className="mt-6 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
          <p className="flex items-center text-sm font-medium text-emerald-400">
            <Check className="mr-2 h-4 w-4" /> ✓ Pipeline complete
          </p>
        </div>
      )}
    </div>
  );
}
