'use client';

import { create } from 'zustand';
import { ProjectStatus, PipelineStage } from '@/types';

interface PipelineState {
  status: ProjectStatus;
  currentStage: PipelineStage;
  projectId: string | null;
  pollingInterval: ReturnType<typeof setInterval> | null;

  startPolling: (projectId: string) => void;
  stopPolling: () => void;
  setStage: (stage: PipelineStage) => void;
  setStatus: (status: ProjectStatus) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  status: 'draft',
  currentStage: 'idle',
  projectId: null,
  pollingInterval: null,

  startPolling: (projectId: string) => {
    const existingInterval = get().pollingInterval;
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    set({ projectId });

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        set({
          status: data.status,
          currentStage: data.currentStage,
        });

        if (data.status === 'completed' || data.status === 'failed') {
          get().stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  setStage: (stage: PipelineStage) => {
    set({ currentStage: stage });
  },

  setStatus: (status: ProjectStatus) => {
    set({ status });
  },
}));
