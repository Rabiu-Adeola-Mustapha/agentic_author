'use client';

import { useEffect, useState } from 'react';
import { ProjectHeader } from '@/components/editor/ProjectHeader';
import { PipelineProgress } from '@/components/editor/PipelineProgress';
import { SectionEditor } from '@/components/editor/SectionEditor';
import { EvaluationPanel } from '@/components/editor/EvaluationPanel';
import { usePipelineStore } from '@/store/pipeline.store';
import { SerializedProject, SerializedOutput, SerializedEvaluation, ProjectStatus } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProjectDetailClientProps {
  initialProject: SerializedProject;
  initialOutput: SerializedOutput | null;
  initialEvaluation: SerializedEvaluation | null;
  userPlan: string;
}

export function ProjectDetailClient({ 
  initialProject, 
  initialOutput, 
  initialEvaluation, 
  userPlan 
}: ProjectDetailClientProps) {
  const { status, currentStage } = usePipelineStore();
  
  // We need local state for output/evaluation because we fetch them once polling completes
  const [output, setOutput] = useState<SerializedOutput | null>(initialOutput);
  const [evaluation, setEvaluation] = useState<SerializedEvaluation | null>(initialEvaluation);
  const [isFetchingResult, setIsFetchingResult] = useState(false);

  // The active status prioritizes the store if it's polling, otherwise falls back to initial
  const activeStatus = (!status || (status as any) === 'idle') ? initialProject.status : status;

  // Watch for completion transition from the store
  useEffect(() => {
    if (status === 'completed' && !output && !isFetchingResult) {
      // Polling just finished successfully, fetch the generated output
      const fetchResults = async () => {
        setIsFetchingResult(true);
        try {
          const res = await fetch(`/api/projects/${initialProject._id}`);
          if (res.ok) {
            const data = await res.json();
            setOutput(data.output);
            setEvaluation(data.evaluation);
          }
        } catch (e) {
          console.error('Failed to fetch generated results', e);
        } finally {
          setIsFetchingResult(false);
        }
      };
      
      fetchResults();
    }
  }, [status, output, initialProject._id, isFetchingResult]);

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <ProjectHeader 
        projectId={initialProject._id}
        initialTitle={initialProject.title}
        category={initialProject.category}
        status={activeStatus as ProjectStatus}
        currentStage={currentStage}
        userPlan={userPlan}
      />

      <div className="flex flex-1 flex-col gap-8 p-6 lg:flex-row lg:items-start lg:p-8">
        
        {/* Left Column: Pipeline Progress */}
        <div className="w-full lg:sticky lg:top-32 lg:w-80 shrink-0">
          <PipelineProgress 
            projectId={initialProject._id} 
            initialStatus={initialProject.status} 
          />
        </div>

        {/* Right Column: Output / State */}
        <div className="flex-1 min-w-0">
          {activeStatus === 'running' || activeStatus === 'draft' ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center h-[500px]">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-6">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <div className="absolute inset-0 animate-ping rounded-full ring-2 ring-indigo-500/30" />
              </div>
              <h2 className="font-sora text-2xl font-bold text-zinc-100 mb-2">Generating your content</h2>
              <p className="text-zinc-400 max-w-sm">
                Your AI agents are working through the pipeline. This usually takes 1-3 minutes depending on the length and complexity.
              </p>
            </div>
          ) : activeStatus === 'completed' ? (
            isFetchingResult ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="mt-4 text-zinc-400">Loading your final document...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                {output && (
                  <SectionEditor 
                    projectId={initialProject._id} 
                    initialSections={output.sections} 
                    expectedLengthConfig={output.metadata?.targetWordCount ? { 
                      min: output.metadata.targetWordCount * 0.8, 
                      max: output.metadata.targetWordCount * 1.2 
                    } : undefined}
                  />
                )}
                {evaluation && (
                  <EvaluationPanel evaluation={evaluation} />
                )}
              </div>
            )
          ) : activeStatus === 'failed' ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center h-[500px]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="font-sora text-2xl font-bold text-red-400 mb-2">Generation Failed</h2>
              <p className="text-zinc-400 max-w-sm">
                An error occurred while generating your content. Please try restarting the pipeline from the progress panel.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
