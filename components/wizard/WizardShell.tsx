'use client';

import { useWizardStore } from '@/store/wizard.store';
import { StepCategoryPicker } from './StepCategoryPicker';
import { StepStructuredQuestions } from './StepStructuredQuestions';
import { StepPromptReview } from './StepPromptReview';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface WizardShellProps {
  onComplete: () => Promise<void>;
  isSubmitting: boolean;
}

const STEPS = [
  { num: 1, label: 'Choose Category' },
  { num: 2, label: 'Tell Us More' },
  { num: 3, label: 'Review Prompt' },
];

export function WizardShell({ onComplete, isSubmitting }: WizardShellProps) {
  const { 
    currentStep, 
    setCurrentStep, 
    category, 
    answers, 
    brainstormHistory,
    generatedPrompt,
    setGeneratedPrompt,
    isGeneratingPrompt,
    setIsGeneratingPrompt
  } = useWizardStore();
  
  const { toast } = useToast();

  const isStep1Complete = !!category;
  const isStep2Complete = !!(answers.title && answers.targetAudience && answers.tone);
  const isStep3Complete = !!generatedPrompt?.trim();

  const isCurrentStepValid = () => {
    if (currentStep === 1) return isStep1Complete;
    if (currentStep === 2) return isStep2Complete;
    if (currentStep === 3) return isStep3Complete;
    return false;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Trigger prompt generation
      setIsGeneratingPrompt(true);
      try {
        const res = await fetch('/api/wizard/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, answers, brainstormHistory }),
        });
        
        if (!res.ok) throw new Error('Failed to generate prompt');
        
        const data = await res.json();
        setGeneratedPrompt(data.generatedPrompt);
        setCurrentStep(3);
      } catch (error) {
        toast({
          title: 'Generation failed',
          description: 'Could not generate the prompt. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsGeneratingPrompt(false);
      }
    } else if (currentStep === 3) {
      await onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[680px] rounded-xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
      {/* STEP INDICATOR */}
      <div className="mb-10 relative">
        <div className="absolute left-0 top-[11px] h-0.5 w-full bg-zinc-800"></div>
        <ul className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            
            // Draw connecting lines (indigo if preceding step is complete)
            const showActiveLine = isCompleted || (isActive && idx > 0);

            return (
              <li key={step.num} className="flex flex-col items-center">
                <div 
                  className={cn(
                    "relative z-10 flex h-[24px] w-[24px] items-center justify-center rounded-full transition-all duration-300 ring-4 ring-zinc-950",
                    isCompleted ? "bg-emerald-500 text-white" : 
                    isActive ? "bg-zinc-950 border-2 border-indigo-500" : 
                    "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : isActive ? (
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  ) : (
                    <span className="text-[10px] font-bold">{step.num}</span>
                  )}
                </div>
                
                {/* Active line connecting from previous to this */}
                {idx > 0 && showActiveLine && (
                  <div 
                    className="absolute top-[11px] h-0.5 bg-indigo-500 transition-all duration-500 ease-out" 
                    style={{ 
                      right: `${100 - (idx * 50)}%`, 
                      left: `${(idx - 1) * 50}%`,
                      width: '50%'
                    }}
                  />
                )}
                
                <span className={cn(
                  "mt-3 text-xs font-semibold tracking-wide uppercase transition-colors",
                  isActive ? "text-indigo-400" : isCompleted ? "text-emerald-400" : "text-zinc-600"
                )}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ACTIVE STEP CONTENT */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <StepCategoryPicker />}
        {currentStep === 2 && <StepStructuredQuestions />}
        {currentStep === 3 && <StepPromptReview />}
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="mt-10 flex items-center justify-between border-t border-zinc-800 pt-6">
        {currentStep > 1 ? (
          <button
            onClick={handleBack}
            disabled={isSubmitting || isGeneratingPrompt}
            className="rounded-md border border-zinc-700 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div></div> // Spacer
        )}

        <button
          onClick={handleNext}
          disabled={!isCurrentStepValid() || isSubmitting || isGeneratingPrompt}
          className="flex min-w-[120px] items-center justify-center gap-2 rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPrompt || isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentStep === 3 ? (
            'Start Generation'
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
