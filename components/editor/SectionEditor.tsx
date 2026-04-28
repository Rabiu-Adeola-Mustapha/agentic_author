'use client';

import { useState, useRef, useEffect } from 'react';
import { OutputSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface SectionEditorProps {
  projectId: string;
  initialSections: OutputSection[];
  expectedLengthConfig?: { min: number; max: number };
}

export function SectionEditor({ projectId, initialSections, expectedLengthConfig }: SectionEditorProps) {
  const [sections, setSections] = useState<OutputSection[]>(initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const isDirty = JSON.stringify(sections) !== JSON.stringify(initialSections);
  
  const totalWords = sections.reduce((acc, section) => acc + (section.wordCount || 0), 0);

  const handleSectionChange = (index: number, newContent: string) => {
    const updated = [...sections];
    // Simple rough word count
    const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
    updated[index] = { ...updated[index], content: newContent, wordCount };
    setSections(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/output`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      if (!res.ok) throw new Error('Failed to save sections');

      // Note: we'd ideally update initialSections in the parent, but since 
      // Next.js router.refresh() handles that, we just show a toast
      toast({ title: 'Changes saved successfully', variant: 'default' });
      
      // Update local state to match so button hides, or we wait for parent refresh
      // We rely on parent doing router.refresh() or we just mutate our local ref
      // For now, we don't have a way to mutate the prop directly, but router refresh is standard.
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to save changes', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to auto-resize textareas
  const TextareaAutoResize = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value]);

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[200px] resize-none overflow-hidden bg-transparent font-sans text-[15px] leading-[1.75] text-zinc-100 focus:outline-none"
        placeholder="Type here..."
      />
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <h2 className="font-sora text-lg font-bold text-zinc-100">Document Editor</h2>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            expectedLengthConfig && totalWords < expectedLengthConfig.min ? "bg-yellow-500/20 text-yellow-500" : "bg-emerald-500/20 text-emerald-400"
          )}>
            Total: {totalWords} words
          </span>
        </div>

        {isDirty && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        )}
      </div>

      {/* Editor Body */}
      <div className="flex flex-col gap-8 p-8 max-w-4xl mx-auto w-full">
        {sections.map((section, index) => (
          <div key={section.key || index} className="group flex flex-col">
            <div className="mb-4 flex items-baseline justify-between border-b border-zinc-700 pb-2">
              <h3 className="font-sora text-lg font-bold text-zinc-100">
                {section.title}
              </h3>
              <span className="text-xs font-medium text-zinc-500">
                {section.wordCount} words
              </span>
            </div>
            <div className="relative">
              <TextareaAutoResize 
                value={section.content} 
                onChange={(val) => handleSectionChange(index, val)} 
              />
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="py-20 text-center text-zinc-500">
            No content available.
          </div>
        )}
      </div>
    </div>
  );
}
