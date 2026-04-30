'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardShell } from '@/components/wizard/WizardShell';
import { useWizardStore } from '@/store/wizard.store';
import { useToast } from '@/components/ui/use-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { category, answers, generatedPrompt, resetWizard } = useWizardStore();

  const handleWizardComplete = async () => {
    if (!category || !generatedPrompt) {
      toast({
        title: 'Error',
        description: 'Please complete all steps',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create project
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: answers.title,
          category,
          rawPrompt: generatedPrompt,
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create project');
      const project = await createRes.json();

      // Start pipeline
      const runRes = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          rawPrompt: generatedPrompt,
          category,
        }),
      });

      if (!runRes.ok) throw new Error('Failed to start pipeline');

      toast({
        title: 'Project created',
        description: 'Pipeline started. Check the project page for progress.',
      });

      resetWizard();
      router.push(`/dashboard/projects/${project._id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-sora font-bold mb-2">Create New Project</h1>
        <p className="text-zinc-400">Follow the steps below to create your content</p>
      </div>

      <WizardShell
        onComplete={handleWizardComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
