'use client';

import { useEffect, useState, use } from 'react';
import { usePipelineStore } from '@/store/pipeline.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Check, AlertCircle, Sparkles, BookOpen, ArrowRight, Zap } from 'lucide-react';

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

  const { startPolling, stopPolling, currentStage, status } = usePipelineStore();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);

          if (data.status === 'running' || data.status === 'draft') {
            startPolling(projectId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();

    return () => {
      stopPolling();
    };
  }, [projectId, startPolling, stopPolling]);

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

  const currentStatus = status || project.status;
  const currentStageDisplay = currentStage || project.currentStage;
  const isRunning = currentStatus === 'running';
  const isCompleted = currentStatus === 'completed';

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
                        : 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50'
                  }`}
                >
                  {isRunning && <Zap className="w-3 h-3 mr-2" />}
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>

                {isRunning && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/30 rounded-full border border-zinc-700/30">
                    <span className="text-xs text-zinc-400">Current stage:</span>
                    <span className="text-xs font-medium text-indigo-400">{currentStageDisplay}</span>
                  </div>
                )}
              </div>
            </div>

            {project.output && (
              <div className="flex gap-2 shrink-0">
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
              </div>
            )}
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
        {!project.output && (
          <section className="flex items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 mb-8 animate-pulse">
                <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-sora font-bold text-zinc-100 mb-3">
                {currentStatus === 'draft' ? '🚀 Ready to Generate' : '⏳ Generating Content'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {currentStatus === 'draft'
                  ? 'Click the start button to begin your 6-stage AI generation pipeline'
                  : `Your content is being created using advanced AI. Current stage: ${currentStageDisplay || 'processing'}...`}
              </p>
              {isRunning && (
                <div className="flex justify-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
