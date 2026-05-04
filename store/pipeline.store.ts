import { create } from 'zustand';
import { ProjectStatus, PipelineStage } from '@/types';

interface PipelineState {
  projectId: string | null;
  status: ProjectStatus | 'idle';
  currentStage: PipelineStage | 'idle' | 'done';
  errorMessage: string | null;
  pollingIntervalId: NodeJS.Timeout | null;
  
  startPolling: (projectId: string) => void;
  stopPolling: () => void;
  resetPipeline: () => void;
}

const initialState = {
  projectId: null,
  status: 'idle' as const,
  currentStage: 'idle' as const,
  errorMessage: null,
  pollingIntervalId: null,
};

export const usePipelineStore = create<PipelineState>((set, get) => ({
  ...initialState,

  startPolling: (projectId: string) => {
    // Clear any existing interval first
    const currentInterval = get().pollingIntervalId;
    if (currentInterval) {
      clearInterval(currentInterval);
    }

    set({ projectId, errorMessage: null });

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/status`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        
        set({
          status: data.status,
          currentStage: data.currentStage,
          errorMessage: null,
        });

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'awaiting_approval') {
          get().stopPolling();
        }
      } catch (err) {
        set({ errorMessage: err instanceof Error ? err.message : 'Unknown error' });
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then set interval for every 3s
    const intervalId = setInterval(fetchStatus, 3000);
    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    set({ pollingIntervalId: null });
  },

  resetPipeline: () => {
    get().stopPolling();
    set({
      projectId: null,
      status: 'idle',
      currentStage: 'idle',
      pollingIntervalId: null,
      errorMessage: null,
    });
  },
}));
