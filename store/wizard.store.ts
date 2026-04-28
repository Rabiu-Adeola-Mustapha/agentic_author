import { create } from 'zustand';
import { ContentCategory } from '@/types';

export interface WizardAnswers {
  title?: string;
  genre?: string;
  targetAudience?: string;
  ageGroup?: string;
  educationLevel?: string;
  tone?: string;
  style?: string;
  length?: string;
  chapterCount?: string;
  depth?: string;
  geographicalContext?: string;
  language?: string;
  constraints: string[];
  additionalNotes?: string;
  // Dynamic smart follow-ups
  [key: string]: string | string[] | undefined;
}

export interface RefinementHistoryEntry {
  promptVersion: string;
  editedAt: string;
}

export interface BrainstormMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface WizardState {
  currentStep: number;
  category: ContentCategory | null;
  answers: WizardAnswers;
  brainstormHistory: BrainstormMessage[];
  isBrainstormReady: boolean;
  generatedPrompt: string | null;
  isGeneratingPrompt: boolean;
  isRefiningPrompt: boolean;
  refinementHistory: RefinementHistoryEntry[];

  setCategory: (category: ContentCategory) => void;
  setAnswer: (field: string, value: string) => void;
  setConstraint: (constraint: string, add: boolean) => void;
  addBrainstormMessage: (message: BrainstormMessage) => void;
  setBrainstormHistory: (messages: BrainstormMessage[]) => void;
  setBrainstormReady: (ready: boolean) => void;
  setCurrentStep: (step: number) => void;
  setGeneratedPrompt: (prompt: string) => void;
  setIsGeneratingPrompt: (isGenerating: boolean) => void;
  setIsRefiningPrompt: (isRefining: boolean) => void;
  undoLastRefinement: () => void;
  resetWizard: () => void;
}

const initialState = {
  currentStep: 1,
  category: null,
  answers: { constraints: [] },
  brainstormHistory: [],
  isBrainstormReady: false,
  generatedPrompt: null,
  isGeneratingPrompt: false,
  isRefiningPrompt: false,
  refinementHistory: [],
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setCategory: (category: ContentCategory) => {
    set({
      category,
      answers: { constraints: [] },
      brainstormHistory: [],
      isBrainstormReady: false,
      generatedPrompt: null,
      refinementHistory: [],
    });
  },

  setAnswer: (field: string, value: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [field]: value,
      },
    }));
  },

  setConstraint: (constraint: string, add: boolean) => {
    set((state) => {
      const constraints = new Set(state.answers.constraints || []);
      if (add) {
        constraints.add(constraint);
      } else {
        constraints.delete(constraint);
      }
      return {
        answers: {
          ...state.answers,
          constraints: Array.from(constraints),
        },
      };
    });
  },

  addBrainstormMessage: (message: BrainstormMessage) => {
    set((state) => ({
      brainstormHistory: [...state.brainstormHistory, message],
    }));
  },

  setBrainstormHistory: (messages: BrainstormMessage[]) => {
    set({ brainstormHistory: messages });
  },

  setBrainstormReady: (ready: boolean) => {
    set({ isBrainstormReady: ready });
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  setGeneratedPrompt: (prompt: string) => {
    set((state) => {
      const history = [...state.refinementHistory];
      if (state.generatedPrompt) {
        // Save current prompt to history before overwriting
        history.unshift({
          promptVersion: state.generatedPrompt,
          editedAt: new Date().toISOString(),
        });
      }
      return {
        generatedPrompt: prompt,
        refinementHistory: history,
      };
    });
  },

  setIsGeneratingPrompt: (isGenerating: boolean) => {
    set({ isGeneratingPrompt: isGenerating });
  },

  setIsRefiningPrompt: (isRefining: boolean) => {
    set({ isRefiningPrompt: isRefining });
  },

  undoLastRefinement: () => {
    set((state) => {
      if (state.refinementHistory.length === 0) return state;
      
      const newHistory = [...state.refinementHistory];
      const lastVersion = newHistory.shift(); // Get and remove the top entry
      
      return {
        generatedPrompt: lastVersion!.promptVersion,
        refinementHistory: newHistory,
      };
    });
  },

  resetWizard: () => {
    set(initialState);
  },
}));
