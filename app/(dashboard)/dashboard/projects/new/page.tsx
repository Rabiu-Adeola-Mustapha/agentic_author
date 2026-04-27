'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ContentCategory } from '@/types';

const CATEGORIES = [
  { id: 'book', label: 'Book / Novel', icon: '📚', desc: 'Fiction or non-fiction' },
  { id: 'screenplay', label: 'Screenplay', icon: '🎬', desc: 'Films and scripts' },
  { id: 'thesis', label: 'Academic Thesis', icon: '🎓', desc: 'Academic work' },
  { id: 'journal', label: 'Journal Article', icon: '📰', desc: 'Research article' },
  { id: 'educational', label: 'Educational', icon: '🏫', desc: 'Course content' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCategorySelect = (category: ContentCategory) => {
    setSelectedCategory(category);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !title || !prompt) return;

    setLoading(true);

    try {
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: selectedCategory,
          rawPrompt: prompt,
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create project');
      const project = await createRes.json();

      const runRes = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          rawPrompt: prompt,
          category: selectedCategory,
        }),
      });

      if (!runRes.ok) throw new Error('Failed to start pipeline');

      toast({
        title: 'Project created',
        description: 'Pipeline started. Check the project page for progress.',
      });

      router.push(`/dashboard/projects/${project._id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive' as const,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {step === 'category' ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-sora font-bold mb-2">Choose Content Type</h1>
            <p className="text-zinc-400">What would you like to create?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id as ContentCategory)}
                className="text-left"
              >
                <Card className="hover:border-indigo-600 transition-all cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{cat.icon}</div>
                    <h3 className="font-semibold text-lg mb-1">{cat.label}</h3>
                    <p className="text-sm text-zinc-400">{cat.desc}</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('category')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-sora font-bold">Create Project</h1>
              <p className="text-zinc-400">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Last Detective, AI in Healthcare"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create in detail..."
                required
                disabled={loading}
                rows={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
              disabled={loading}
            >
              {loading ? 'Starting pipeline...' : 'Start Generation'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
