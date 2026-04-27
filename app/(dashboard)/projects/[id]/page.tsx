'use client';

import { useEffect, useState } from 'react';
import { usePipelineStore } from '@/store/pipeline.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Download, Check, AlertCircle } from 'lucide-react';

const STAGES = ['prompt', 'plan', 'research', 'writing', 'evaluation', 'done'];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { startPolling, stopPolling, currentStage, status } = usePipelineStore();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          setEditedContent(data.output?.content || '');

          if (data.status === 'running' || data.status === 'draft') {
            startPolling(params.id);
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
  }, [params.id, startPolling, stopPolling]);

  const stageIndex = STAGES.indexOf((currentStage || project?.currentStage) as string);
  const progress = Math.max(0, ((stageIndex + 1) / STAGES.length) * 100);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${params.id}?format=${format}`);
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
    return <div className="p-8 text-center">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  const currentStatus = status || project.status;
  const currentStageDisplay = currentStage || project.currentStage;

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-sora font-bold">{project.title}</h1>
          <Badge className="mt-2">{currentStatus}</Badge>
        </div>
        {project.output && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={() => handleExport('docx')}
              disabled={exporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              DOCX
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Tracker */}
        <div className="space-y-4">
          <h2 className="text-xl font-sora font-bold">Pipeline Progress</h2>
          <div className="space-y-3">
            {STAGES.map((stage, i) => {
              const isDone = i < stageIndex || (i === stageIndex && currentStatus !== 'running');
              const isActive = i === stageIndex && currentStatus === 'running';
              const isFailed = currentStatus === 'failed' && currentStageDisplay === 'failed';

              return (
                <div key={stage} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isDone || (isActive && !isFailed)
                        ? 'bg-indigo-600 text-white'
                        : isFailed
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                    } ${isActive ? 'animate-pulse' : ''}`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="capitalize text-sm">{stage}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">Overall Progress</p>
            <Progress value={progress} />
          </div>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-sora font-bold">Output Content</h2>
          {project.output ? (
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-96 font-mono text-sm"
              />

              {project.evaluation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-400 mb-2">Alignment Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {project.evaluation.alignmentScore}
                          </span>
                          <span className="text-xs text-zinc-500">/100</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-400 mb-2">Quality Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {project.evaluation.qualityScore}
                          </span>
                          <span className="text-xs text-zinc-500">/100</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-zinc-400 mb-2">Overall Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{project.evaluation.score}</span>
                          <span className="text-xs text-zinc-500">/100</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {project.evaluation.issues.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="font-semibold flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4" />
                          Issues
                        </p>
                        <ul className="space-y-1 text-sm">
                          {project.evaluation.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-zinc-300">• {issue}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {project.evaluation.suggestions.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="font-semibold mb-3">Suggestions</p>
                        <ul className="space-y-1 text-sm">
                          {project.evaluation.suggestions.map((sug: string, i: number) => (
                            <li key={i} className="text-zinc-300">• {sug}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-zinc-400">
                  {currentStatus === 'draft' ? 'Waiting to start generation...' : 'Generating content...'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
