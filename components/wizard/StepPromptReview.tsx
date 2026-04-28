'use client';

import { useState, useRef, useEffect } from 'react';
import { useWizardStore } from '@/store/wizard.store';
import { CATEGORY_CONFIG } from '@/lib/config/category-config';
import { Loader2, ArrowLeft, History, Edit2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export function StepPromptReview() {
  const { 
    category, 
    generatedPrompt, 
    setGeneratedPrompt, 
    isRefiningPrompt, 
    setIsRefiningPrompt,
    refinementHistory,
    undoLastRefinement
  } = useWizardStore();
  
  const { toast } = useToast();
  const [userEdits, setUserEdits] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [generatedPrompt]);

  const handleRefine = async () => {
    if (!userEdits.trim() || !generatedPrompt) return;
    
    setIsRefiningPrompt(true);
    try {
      const res = await fetch('/api/wizard/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          currentPrompt: generatedPrompt,
          userEdits
        }),
      });
      
      if (!res.ok) throw new Error('Failed to refine prompt');
      
      const data = await res.json();
      setGeneratedPrompt(data.refinedPrompt);
      setUserEdits('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      toast({
        title: 'Refinement failed',
        description: 'Could not process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const wordCount = generatedPrompt ? generatedPrompt.trim().split(/\s+/).length : 0;
  
  let qualityLabel = 'Good';
  let qualityColor = 'text-zinc-500';
  if (wordCount < 100) {
    qualityLabel = 'Prompt may be too short for best results';
    qualityColor = 'text-yellow-500';
  } else if (wordCount > 200) {
    qualityLabel = 'Excellent';
    qualityColor = 'text-emerald-500';
  }

  const categoryLabel = category ? CATEGORY_CONFIG[category].label : 'Unknown Category';

  return (
    <div className="flex flex-col gap-6 lg:flex-row animate-in slide-in-from-right-4 duration-300">
      {/* LEFT COLUMN: Prompt Display */}
      <div className="flex flex-1 flex-col">
        <div className="relative flex-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1">
          {refinementHistory.length > 0 && generatedPrompt !== refinementHistory[0]?.promptVersion && (
            <div className="absolute right-3 top-3 z-10 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500" title="Unsaved manual edits"></span>
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            value={generatedPrompt || ''}
            onChange={(e) => setGeneratedPrompt(e.target.value)}
            className="w-full min-h-[280px] resize-none rounded-md bg-transparent px-4 py-4 text-[15px] leading-[1.8] text-zinc-50 focus:outline-none"
            spellCheck={false}
          />
        </div>
        
        {/* STATS BAR */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-zinc-400 font-medium bg-zinc-800 px-2 py-1 rounded">
            {wordCount} words
          </span>
          <span className="text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
            {categoryLabel}
          </span>
          <span className={cn('font-medium', qualityColor)}>
            {qualityLabel}
          </span>
        </div>
        
        <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <Edit2 className="h-4 w-4" />
          You can also edit the prompt directly above — your changes are preserved when you refine with AI.
        </p>
      </div>

      {/* RIGHT COLUMN: Refinement Panel */}
      <div className="w-full lg:w-[40%] flex flex-col gap-6">
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-5">
          <h3 className="font-sora text-lg font-semibold text-zinc-100">Refine with AI</h3>
          <p className="mb-4 text-sm text-zinc-400">Tell the AI what to change.</p>
          
          <textarea
            value={userEdits}
            onChange={(e) => setUserEdits(e.target.value)}
            rows={3}
            placeholder="e.g. Make it more formal, Add emphasis on the cultural context..."
            className="mb-4 w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          
          <div className="relative">
            <button
              onClick={handleRefine}
              disabled={isRefiningPrompt || !userEdits.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefiningPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refine Prompt'}
            </button>
            {showSuccess && (
              <div className="absolute -bottom-8 left-0 right-0 text-center text-sm font-medium text-emerald-400 animate-in fade-in slide-in-from-top-1">
                Prompt refined ✓
              </div>
            )}
          </div>
        </div>

        {/* History and Undo */}
        {refinementHistory.length > 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h4 className="mb-3 text-sm font-medium text-zinc-300">History</h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  undoLastRefinement();
                  toast({ title: 'Reverted to previous version' });
                }}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Undo last refinement
              </button>

              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors w-fit">
                    <History className="h-4 w-4" />
                    View revision history ({refinementHistory.length})
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
                  <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95">
                    <Dialog.Title className="font-sora text-xl font-semibold text-zinc-100 mb-4">
                      Revision History
                    </Dialog.Title>
                    <div className="space-y-6">
                      {refinementHistory.map((entry, idx) => (
                        <div key={idx} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-zinc-400">
                              {new Date(entry.editedAt).toLocaleString()}
                            </span>
                            <Dialog.Close asChild>
                              <button
                                onClick={() => {
                                  // Restore this specific version
                                  setGeneratedPrompt(entry.promptVersion);
                                  toast({ title: 'Restored from history' });
                                }}
                                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-md bg-indigo-500/10"
                              >
                                Restore this version
                              </button>
                            </Dialog.Close>
                          </div>
                          <div className="rounded bg-zinc-900 p-3 text-sm text-zinc-300 line-clamp-3">
                            {entry.promptVersion}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Dialog.Close asChild>
                        <button className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700">
                          Close
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
