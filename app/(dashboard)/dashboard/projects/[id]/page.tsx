'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { usePipelineStore } from '@/store/pipeline.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Check, AlertCircle, Sparkles, BookOpen, ArrowRight, Zap, Loader2, Play, RotateCcw } from 'lucide-react';

const STAGES = [
  { name: 'prompt', label: 'Prompt', icon: '🎯' },
  { name: 'plan', label: 'Planning', icon: '📋' },
  { name: 'research', label: 'Research', icon: '🔍' },
  { name: 'writing', label: 'Writing', icon: '✍️' },
  { name: 'evaluation', label: 'Evaluation', icon: '⭐' },
  { name: 'done', label: 'Complete', icon: '✨' },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [promptFeedback, setPromptFeedback] = useState('');
  const [researchFeedback, setResearchFeedback] = useState('');
  const [evaluationFeedback, setEvaluationFeedback] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isIteratingResearch, setIsIteratingResearch] = useState(false);
  const [isExecutingWriting, setIsExecutingWriting] = useState(false);
  const [isIteratingWriter, setIsIteratingWriter] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const { startPolling, stopPolling, currentStage, status } = usePipelineStore();

  const handleStart = async () => {
    setIsStarting(true);
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
      console.error('Failed to start pipeline', e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleContinue = async () => {
    setIsContinuing(true);
    try {
      const res = await fetch('/api/pipeline/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        startPolling(projectId);
        // Optimistically update status
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'plan' }));
      }
    } catch (e) {
      console.error('Failed to continue pipeline', e);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleIterate = async () => {
    if (!promptFeedback.trim()) return;
    setIsIterating(true);
    try {
      const res = await fetch('/api/pipeline/iterate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, feedback: promptFeedback }),
      });
      if (res.ok) {
        setPromptFeedback('');
        startPolling(projectId);
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'prompt' }));
      }
    } catch (e) {
      console.error('Failed to iterate prompt', e);
    } finally {
      setIsIterating(false);
    }
  };

  const handleExecuteResearch = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/pipeline/execute-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        startPolling(projectId);
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'research' }));
      }
    } catch (e) {
      console.error('Failed to execute research', e);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleIterateResearch = async () => {
    if (!researchFeedback.trim()) return;
    setIsIteratingResearch(true);
    try {
      const res = await fetch('/api/pipeline/iterate-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, feedback: researchFeedback }),
      });
      if (res.ok) {
        setResearchFeedback('');
        startPolling(projectId);
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'research' }));
      }
    } catch (e) {
      console.error('Failed to iterate research', e);
    } finally {
      setIsIteratingResearch(false);
    }
  };

  const handleExecuteWriting = async () => {
    setIsExecutingWriting(true);
    try {
      const res = await fetch('/api/pipeline/execute-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        startPolling(projectId);
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'writing' }));
      }
    } catch (e) {
      console.error('Failed to execute writing', e);
    } finally {
      setIsExecutingWriting(false);
    }
  };

  const handleIterateWriter = async () => {
    if (!evaluationFeedback.trim()) return;
    setIsIteratingWriter(true);
    try {
      const res = await fetch('/api/pipeline/iterate-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, feedback: evaluationFeedback }),
      });
      if (res.ok) {
        setEvaluationFeedback('');
        startPolling(projectId);
        setProject((prev: any) => ({ ...prev, status: 'running', currentStage: 'writing' }));
      }
    } catch (e) {
      console.error('Failed to iterate writer', e);
    } finally {
      setIsIteratingWriter(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const res = await fetch('/api/pipeline/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        setProject((prev: any) => ({ ...prev, status: 'completed', currentStage: 'done' }));
      }
    } catch (e) {
      console.error('Failed to finalize project', e);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    stopPolling();
    try {
      const res = await fetch(`/api/projects/${projectId}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        // Reset local state
        setProject((prev: any) => ({ ...prev, status: 'draft', currentStage: 'idle' }));
      } else {
        console.error('Reset failed:', await res.text());
      }
    } catch (e) {
      console.error('Failed to reset pipeline', e);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchProjectData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        
        const mergedProject = {
          ...data.project,
          output: data.output,
          evaluation: data.evaluation,
          prompt: data.prompt,
          plan: data.plan,
          research: data.research
        };
        
        setProject(mergedProject);

        // Only auto-poll if it was already 'awaiting_approval' (safe state)
        if (mergedProject.status === 'awaiting_approval') {
          startPolling(projectId);
        }

        if (data.prompt?.finalPrompt) {
          setEditedPrompt(data.prompt.finalPrompt);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, startPolling]);

  // Initial fetch on mount
  useEffect(() => {
    fetchProjectData();

    return () => {
      stopPolling();
    };
  }, [fetchProjectData, stopPolling]);

  // Refetch data when polling detects a state transition to a terminal/review state
  useEffect(() => {
    if (status === 'awaiting_approval' || status === 'completed') {
      fetchProjectData();
    }
  }, [status, fetchProjectData]);

  const stageIndex = STAGES.findIndex(s => s.name === (currentStage || project?.currentStage));
  const progress = Math.max(0, ((stageIndex + 1) / STAGES.length) * 100);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${projectId}?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <p className="text-zinc-300 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Project not found</p>
      </div>
    );
  }

  const currentStatus = (!status || status === 'idle') ? project.status : status;
  const currentStageDisplay = (!currentStage || currentStage === 'idle') ? project.currentStage : currentStage;
  const isRunning = currentStatus === 'running';
  const isCompleted = currentStatus === 'completed';
  const isAwaitingApproval = currentStatus === 'awaiting_approval';

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/50 to-transparent backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Project</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-sora font-bold text-zinc-100 mb-4 leading-tight">
                {project.title}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  className={`px-4 py-2 font-medium border ${
                    isRunning
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isAwaitingApproval
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50'
                  }`}
                >
                  {isRunning && <Zap className="w-3 h-3 mr-2" />}
                  {isAwaitingApproval ? 'Awaiting Your Approval' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>

                {isRunning && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/30 rounded-full border border-zinc-700/30">
                    <span className="text-xs text-zinc-400">Current stage:</span>
                    <span className="text-xs font-medium text-indigo-400">{currentStageDisplay}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Reset button for stuck/failed states */}
              {(isRunning || currentStatus === 'failed' || isAwaitingApproval) && (
                <Button
                  onClick={handleReset}
                  disabled={isResetting}
                  variant="outline"
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-all"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Reset Pipeline
                </Button>
              )}
              {project.output && (
                <>
                  <Button
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                    className="border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => handleExport('docx')}
                    disabled={exporting}
                    className="border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    DOCX
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        {/* Pipeline Progress */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-indigo-400" />
              Generation Pipeline
            </h2>
            <p className="text-sm text-zinc-400">Real-time progress through 6 generation stages</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stage Timeline */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {STAGES.map((stage, i) => {
                  const isDone = i < stageIndex || (i === stageIndex && !isRunning);
                  const isActive = i === stageIndex && isRunning;

                  return (
                    <div key={stage.name} className="group">
                      <div className="flex items-start gap-4">
                        {/* Stage Circle */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div
                            className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                              isDone
                                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30'
                                : isActive
                                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900 scale-110'
                                  : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isDone ? <Check className="w-6 h-6" /> : stage.icon}
                          </div>

                          {/* Connector Line */}
                          {i < STAGES.length - 1 && (
                            <div
                              className={`absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-12 transition-all duration-500 ${
                                isDone ? 'bg-emerald-600' : isActive ? 'bg-indigo-600' : 'bg-zinc-800'
                              }`}
                            ></div>
                          )}
                        </div>

                        {/* Stage Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-zinc-100">{stage.label}</h3>
                            {isActive && (
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">
                            {isDone ? '✓ Completed' : isActive ? '⏳ In progress' : 'Waiting...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/50 rounded-xl border border-zinc-700/50 p-8 backdrop-blur-sm h-fit">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Progress</p>

              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-4xl font-sora font-bold text-indigo-400">{Math.round(progress)}%</span>
                  <span className="text-xs text-zinc-500">{stageIndex + 1}/{STAGES.length}</span>
                </div>
                <Progress value={progress} className="h-2.5 bg-zinc-700/50" />
              </div>

              <div className="space-y-3 pt-6 border-t border-zinc-700/30">
                {isCompleted && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    All stages complete
                  </div>
                )}
                {isRunning && (
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Processing...
                  </div>
                )}
                {!isRunning && !isCompleted && (
                  <div className="text-zinc-400 text-sm">Ready to start</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Generated Content */}
        {project.output && (
          <section>
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Generated Content
              </h2>
              <p className="text-sm text-zinc-400">Your AI-generated document</p>
            </div>

            <article className="bg-gradient-to-br from-zinc-800/20 to-zinc-900/30 rounded-xl border border-zinc-700/50 p-12 backdrop-blur-sm">
              <div className="prose prose-invert max-w-none text-zinc-200 prose-headings:text-zinc-100 prose-headings:font-sora prose-a:text-indigo-400 space-y-6">
                {project.output.content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: project.output.content
                        .split('\n\n')
                        .map((para: string) => {
                          // Header detection
                          if (para.match(/^#{1,6}\s/)) {
                            const level = para.match(/^(#+)/)?.[1].length || 1;
                            const text = para.replace(/^#+\s/, '');
                            const sizes = ['3xl', '2xl', 'xl', 'lg', 'base', 'sm'];
                            return `<h${level} class="text-${sizes[level - 1]} font-sora font-bold text-zinc-50 mt-8 mb-4">${text}</h${level}>`;
                          }
                          // Paragraph
                          return `<p class="text-base leading-7">${para}</p>`;
                        })
                        .join(''),
                    }}
                  />
                ) : (
                  <p className="text-zinc-400 italic text-center py-12">No content generated yet</p>
                )}
              </div>
            </article>
          </section>
        )}

        {/* Quality Evaluation - Premium Circular Design */}
        {project.evaluation && (
          <section>
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Quality Evaluation
              </h2>
              <p className="text-sm text-zinc-400">AI-powered quality assessment</p>
            </div>

            {/* Circular Score Display */}
            <div className="flex justify-center mb-16">
              <div className="relative w-80 h-80">
                {/* Background Gradient Circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 blur-xl"></div>
                <div className="absolute inset-0 rounded-full border border-indigo-500/20"></div>

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl font-sora font-bold text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text mb-2">
                      {project.evaluation.score}
                    </div>
                    <div className="text-sm font-semibold text-zinc-300">Overall Score</div>
                  </div>
                </div>

                {/* Orbit Badges */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Alignment - Top Right */}
                  <div className="absolute top-4 right-4 group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-700/20 border border-emerald-500/40 flex flex-col items-center justify-center group-hover:from-emerald-600/50 group-hover:to-emerald-700/30 group-hover:border-emerald-500/60 transition-all duration-300 cursor-default shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
                      <div className="text-2xl font-sora font-bold text-emerald-300">{project.evaluation.alignmentScore}</div>
                      <div className="text-xs font-semibold text-emerald-200 text-center mt-1">Alignment</div>
                    </div>
                  </div>

                  {/* Quality - Bottom Right */}
                  <div className="absolute bottom-4 right-4 group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/20 border border-blue-500/40 flex flex-col items-center justify-center group-hover:from-blue-600/50 group-hover:to-blue-700/30 group-hover:border-blue-500/60 transition-all duration-300 cursor-default shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                      <div className="text-2xl font-sora font-bold text-blue-300">{project.evaluation.qualityScore}</div>
                      <div className="text-xs font-semibold text-blue-200 text-center mt-1">Quality</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues & Suggestions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {project.evaluation.issues.length > 0 && (
                <Card className="border-red-500/20 bg-gradient-to-br from-red-600/10 to-red-700/5 hover:border-red-500/40 transition-colors">
                  <CardContent className="pt-6">
                    <p className="font-bold flex items-center gap-2 mb-4 text-red-400 text-lg">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      Issues Found
                    </p>
                    <ul className="space-y-3">
                      {project.evaluation.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-3 group">
                          <span className="text-red-500 flex-shrink-0 font-bold group-hover:scale-125 transition-transform">!</span>
                          <span className="group-hover:text-zinc-100 transition-colors">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {project.evaluation.suggestions.length > 0 && (
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-600/10 to-amber-700/5 hover:border-amber-500/40 transition-colors">
                  <CardContent className="pt-6">
                    <p className="font-bold flex items-center gap-2 mb-4 text-amber-400 text-lg">
                      <Sparkles className="w-5 h-5 flex-shrink-0" />
                      Suggestions
                    </p>
                    <ul className="space-y-3">
                      {project.evaluation.suggestions.map((sug: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-3 group">
                          <span className="text-amber-500 flex-shrink-0">💡</span>
                          <span className="group-hover:text-zinc-100 transition-colors">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Waiting State */}
        {!project.output && currentStatus !== 'awaiting_approval' && (
          <section className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 mb-8 animate-pulse">
                <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-sora font-bold text-zinc-100 mb-3">
                {currentStatus === 'draft' ? '🚀 Ready to Generate' : currentStatus === 'failed' ? '⚠️ Generation Failed' : '⏳ Generating Content'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {currentStatus === 'draft'
                  ? 'Click the start button to begin your 6-stage AI generation pipeline'
                  : currentStatus === 'failed'
                  ? 'The pipeline encountered an error. Please click the button below to retry.'
                  : `Your content is being created using advanced AI. Current stage: ${currentStageDisplay || 'processing'}...`}
              </p>
              
              {currentStatus === 'draft' || currentStatus === 'failed' || (currentStatus === 'running' && currentStageDisplay === 'idle') ? (
                <Button onClick={handleStart} disabled={isStarting} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 text-lg">
                  {isStarting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                  {currentStatus === 'failed' ? 'Retry Generation' : 'Start Generation'}
                </Button>
              ) : currentStatus === 'running' ? (
                <div className="flex flex-col items-center">
                  <div className="flex justify-center gap-2 mb-6">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <Button variant="outline" onClick={handleStart} disabled={isStarting} className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                    Restart Pipeline
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* Approval States */}
        {currentStatus === 'awaiting_approval' && currentStageDisplay === 'prompt_review' && (
          <section className="py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Check className="w-6 h-6 text-emerald-400" />
                Prompt Generated
              </h2>
              <p className="text-sm text-zinc-400">Review the generated prompt. You can iterate by providing feedback, or approve it to move to the Planning stage.</p>
            </div>
            
            <Card className="border-zinc-800 bg-zinc-900/30 mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-zinc-100">Current Prompt Version</h3>
                  {project.prompt?.versions?.length > 0 && (
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                      Version {project.prompt.versions.length}
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-200 min-h-[200px] font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-auto">
                  {editedPrompt || project.prompt?.finalPrompt || 'No prompt generated yet.'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/30 border-dashed">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-100 mb-2">Iterate Prompt</h3>
                <p className="text-xs text-zinc-400 mb-4">Not quite right? Provide feedback and the AI will rewrite the prompt.</p>
                <textarea
                  value={promptFeedback}
                  onChange={(e) => setPromptFeedback(e.target.value)}
                  placeholder="e.g., Make it focus more on the psychological aspects of the characters..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
                />
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <Button 
                    onClick={handleIterate} 
                    disabled={isIterating || isContinuing || !promptFeedback.trim()} 
                    variant="outline"
                    className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 px-8 py-6 rounded-full transition-all text-base"
                  >
                    {isIterating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Iterate Prompt
                  </Button>
                  <Button 
                    onClick={handleContinue} 
                    disabled={isContinuing || isIterating} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 rounded-full transition-all shadow-lg shadow-indigo-500/20 text-base"
                  >
                    {isContinuing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                    Approve and Generate Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {currentStatus === 'awaiting_approval' && currentStageDisplay === 'plan_review' && (
          <section className="py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Check className="w-6 h-6 text-emerald-400" />
                Plan Generated
              </h2>
              <p className="text-sm text-zinc-400">Review the structural plan for your content before executing the full pipeline.</p>
            </div>
            
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="p-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-200 min-h-[300px] text-sm leading-relaxed overflow-auto">
                  {project.plan ? (
                    <div className="space-y-6">
                      {project.plan.contentStrategy && (
                        <div>
                          <h4 className="font-bold text-indigo-400 mb-2 border-b border-zinc-800 pb-2">Content Strategy</h4>
                          <p className="text-zinc-300">{project.plan.contentStrategy}</p>
                        </div>
                      )}
                      
                      {project.plan.structure && project.plan.structure.length > 0 && (
                        <div>
                          <h4 className="font-bold text-indigo-400 mb-3 border-b border-zinc-800 pb-2">Document Structure</h4>
                          <div className="space-y-4">
                            {project.plan.structure.map((section: any, idx: number) => (
                              <div key={idx} className="bg-zinc-900/50 p-4 rounded-md border border-zinc-800/50">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-zinc-200">{section.title}</span>
                                  <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                                    ~{section.estimatedWords} words
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-400">{section.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.plan.searchQueries && project.plan.searchQueries.length > 0 && (
                        <div>
                          <h4 className="font-bold text-indigo-400 mb-2 border-b border-zinc-800 pb-2">Search Queries</h4>
                          <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1">
                            {project.plan.searchQueries.map((query: string, idx: number) => (
                              <li key={idx}>{query}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-500 italic">No plan data available.</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleExecuteResearch} 
                    disabled={isExecuting} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 rounded-full transition-all shadow-lg shadow-indigo-500/20 text-lg"
                  >
                    {isExecuting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                    Approve and Start Research
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {currentStatus === 'awaiting_approval' && currentStageDisplay === 'research_review' && (
          <section className="py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Check className="w-6 h-6 text-emerald-400" />
                Research Completed
              </h2>
              <p className="text-sm text-zinc-400">Review the key insights and sources. You can guide the researcher to find more specific info or approve and start writing.</p>
            </div>
            
            <Card className="border-zinc-800 bg-zinc-900/30 mb-6">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-100 mb-4">Research Summary</h3>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-200 min-h-[200px] text-sm leading-relaxed overflow-auto space-y-4">
                  {project.research?.keyInsights ? (
                    <>
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2">Key Insights:</span>
                        <ul className="list-disc list-inside space-y-2 text-zinc-300">
                          {project.research.keyInsights.map((insight: string, i: number) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2">Top Sources:</span>
                        <div className="flex flex-wrap gap-2">
                          {project.research.sources?.slice(0, 5).map((s: any, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-400 hover:text-zinc-200">
                              <a href={s.url} target="_blank" rel="noreferrer">{new URL(s.url).hostname}</a>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-zinc-500 italic">No research data available.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/30 border-dashed">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-100 mb-2">Guide Researcher</h3>
                <p className="text-xs text-zinc-400 mb-4">Want the agent to dig deeper into something? Add URLs or specific search terms.</p>
                <textarea
                  value={researchFeedback}
                  onChange={(e) => setResearchFeedback(e.target.value)}
                  placeholder="e.g., Look specifically for the 2024 quarterly reports from this URL: https://example.com/data"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
                />
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <Button 
                    onClick={handleIterateResearch} 
                    disabled={isIteratingResearch || isExecutingWriting || !researchFeedback.trim()} 
                    variant="outline"
                    className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 px-8 py-6 rounded-full transition-all text-base"
                  >
                    {isIteratingResearch ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Redo Research
                  </Button>
                  <Button 
                    onClick={handleExecuteWriting} 
                    disabled={isExecutingWriting || isIteratingResearch} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 rounded-full transition-all shadow-lg shadow-indigo-500/20 text-base"
                  >
                    {isExecutingWriting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                    Approve and Start Writing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {currentStatus === 'awaiting_approval' && currentStageDisplay === 'evaluation_review' && (
          <section className="py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Check className="w-6 h-6 text-emerald-400" />
                Draft & Evaluation Ready
              </h2>
              <p className="text-sm text-zinc-400">Review the AI draft and the evaluator's critique. You can iterate with the writer or finalize the project.</p>
            </div>
            
            <Card className="border-zinc-800 bg-zinc-900/30 mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-4">Evaluator Report</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-200 min-h-[300px] text-sm leading-relaxed overflow-auto space-y-4">
                      {project.evaluation ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Score:</span>
                            <span className="text-2xl font-bold text-emerald-400">{project.evaluation.score}/100</span>
                          </div>
                          <div>
                            <span className="font-semibold text-red-400 block mb-1">Issues Found:</span>
                            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                              {project.evaluation.issues.map((issue: string, i: number) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-semibold text-indigo-400 block mb-1">Suggestions:</span>
                            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                              {project.evaluation.suggestions.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic">No evaluation data available.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-4">Content Preview</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-200 min-h-[300px] text-xs leading-relaxed overflow-auto font-serif">
                      {project.output?.content ? (
                        <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                          {project.output.content.slice(0, 1000)}...
                          <p className="mt-4 text-indigo-400 font-sans italic">View full document in the Trace section below.</p>
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic">No content generated yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/30 border-dashed">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-100 mb-2">Iterate with Writer</h3>
                <p className="text-xs text-zinc-400 mb-4">Provide specific instructions to the writer to fix the issues found during evaluation.</p>
                <textarea
                  value={evaluationFeedback}
                  onChange={(e) => setEvaluationFeedback(e.target.value)}
                  placeholder="e.g., The evaluator mentioned the tone was too formal. Please rewrite the introduction to be more conversational..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
                />
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <Button 
                    onClick={handleIterateWriter} 
                    disabled={isIteratingWriter || isFinalizing || !evaluationFeedback.trim()} 
                    variant="outline"
                    className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 px-8 py-6 rounded-full transition-all text-base"
                  >
                    {isIteratingWriter ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Rewrite with Feedback
                  </Button>
                  <Button 
                    onClick={handleFinalize} 
                    disabled={isFinalizing || isIteratingWriter} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-6 rounded-full transition-all shadow-lg shadow-emerald-500/20 text-base"
                  >
                    {isFinalizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                    Finalize and Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Pipeline Trace - Visibility into all stages */}
        {(project.prompt || project.plan || project.research || project.output || project.evaluation) && (
          <section className="pt-12 border-t border-zinc-800/50 mt-12">
            <div className="mb-8">
              <h2 className="text-2xl font-sora font-bold text-zinc-100 flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                Pipeline Trace
              </h2>
              <p className="text-sm text-zinc-400">View the detailed outputs generated by the AI agents at every stage of the process.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.prompt && (
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      PromptWriter
                    </h3>
                    <div className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-md overflow-auto max-h-80 whitespace-pre-wrap font-mono leading-relaxed border border-zinc-800/50">
                      {project.prompt.finalPrompt}
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.plan && (
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Planner
                    </h3>
                    <div className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-md overflow-auto max-h-80 space-y-4 border border-zinc-800/50">
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-1 uppercase tracking-wider text-[10px]">Strategy:</span>
                        <span className="text-zinc-400">{project.plan.contentStrategy}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2 uppercase tracking-wider text-[10px]">Structure:</span>
                        <ul className="space-y-2">
                          {project.plan.structure?.map((s: any, i: number) => (
                            <li key={i} className="border-l-2 border-zinc-800 pl-3 py-0.5">
                              <span className="font-medium text-zinc-200 block">{s.title}</span>
                              <span className="text-zinc-500 text-[10px]">{s.estimatedWords} words</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.research && (
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Researcher
                    </h3>
                    <div className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-md overflow-auto max-h-80 space-y-4 border border-zinc-800/50">
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2 uppercase tracking-wider text-[10px]">Key Insights:</span>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                          {project.research.keyInsights?.map((insight: string, i: number) => (
                            <li key={i} className="leading-relaxed">{insight}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2 uppercase tracking-wider text-[10px]">Sources:</span>
                        <ul className="space-y-1.5">
                          {project.research.sources?.map((s: any, i: number) => (
                            <li key={i} className="truncate">
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                {s.title || s.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.output && (
                <Card className="border-zinc-800 bg-zinc-900/30 md:col-span-2 lg:col-span-1">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Writer (Full Draft)
                    </h3>
                    <div className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-md overflow-auto max-h-80 border border-zinc-800/50 font-serif leading-relaxed">
                      <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                        {project.output.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.evaluation && (
                <Card className="border-zinc-800 bg-zinc-900/30 md:col-span-2 lg:col-span-1">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      Evaluator
                    </h3>
                    <div className="text-xs text-zinc-300 bg-zinc-950 p-4 rounded-md overflow-auto max-h-80 space-y-4 border border-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Quality Score:</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{project.evaluation.score}/100</Badge>
                      </div>
                      <div>
                        <span className="font-semibold text-red-400 block mb-2 uppercase tracking-wider text-[10px]">Issues:</span>
                        <ul className="list-disc list-inside space-y-1 text-zinc-400">
                          {project.evaluation.issues?.map((issue: string, i: number) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-indigo-400 block mb-2 uppercase tracking-wider text-[10px]">Suggestions:</span>
                        <ul className="list-disc list-inside space-y-1 text-zinc-400">
                          {project.evaluation.suggestions?.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
