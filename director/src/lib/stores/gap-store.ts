import { create } from 'zustand';
import type { PipelineGap, GapStatus } from '../types/pipeline-gap';

interface GapState {
  gaps: PipelineGap[];
  loading: boolean;
  analyzing: boolean;
  filling: boolean;

  // Queries
  getGapsByEdge: (sourceNodeId: string, targetNodeId: string) => PipelineGap[];

  // CRUD
  loadGaps: (projectId: string, assetSetId: string) => Promise<void>;
  analyzeGaps: (projectId: string, assetSetId: string) => Promise<void>;
  updateGapStatus: (gapId: string, status: GapStatus) => Promise<void>;
  dismissGap: (gapId: string) => Promise<void>;
  acceptGap: (gapId: string) => Promise<void>;
  requestFill: (gapId: string) => Promise<void>;
  fillGap: (gapId: string) => Promise<void>;
}

export const useGapStore = create<GapState>()((set, get) => ({
  gaps: [],
  loading: false,
  analyzing: false,
  filling: false,

  getGapsByEdge: (sourceNodeId: string, targetNodeId: string) => {
    return get().gaps.filter(
      (g) => g.sourceNodeId === sourceNodeId && g.targetNodeId === targetNodeId
    );
  },

  loadGaps: async (projectId: string, assetSetId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(
        `/api/pipeline-gaps?projectId=${encodeURIComponent(projectId)}&assetSetId=${encodeURIComponent(assetSetId)}`
      );
      if (res.ok) {
        const data: PipelineGap[] = await res.json();
        set({ gaps: data, loading: false });
      } else {
        console.error('Failed to load gaps:', res.statusText);
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load gaps:', err);
      set({ loading: false });
    }
  },

  analyzeGaps: async (projectId: string, assetSetId: string) => {
    set({ analyzing: true });
    try {
      const res = await fetch('/api/pipeline-gaps/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, assetSetId }),
      });
      if (res.ok) {
        const data: PipelineGap[] = await res.json();
        set({ gaps: data, analyzing: false });
      } else {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        console.error('Failed to analyze gaps:', errBody.error);
        set({ analyzing: false });
      }
    } catch (err) {
      console.error('Failed to analyze gaps:', err);
      set({ analyzing: false });
    }
  },

  updateGapStatus: async (gapId: string, status: GapStatus) => {
    try {
      const res = await fetch(
        `/api/pipeline-gaps?id=${encodeURIComponent(gapId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        const updated: PipelineGap = await res.json();
        set((state) => ({
          gaps: state.gaps.map((g) => (g.id === gapId ? updated : g)),
        }));
      } else {
        console.error('Failed to update gap status:', res.statusText);
      }
    } catch (err) {
      console.error('Failed to update gap status:', err);
    }
  },

  dismissGap: async (gapId: string) => {
    await get().updateGapStatus(gapId, 'dismissed');
  },

  acceptGap: async (gapId: string) => {
    await get().updateGapStatus(gapId, 'accepted');
  },

  requestFill: async (gapId: string) => {
    await get().updateGapStatus(gapId, 'fill-requested');
    // Auto-trigger the full fill flow after status update
    await get().fillGap(gapId);
  },

  fillGap: async (gapId: string) => {
    set({ filling: true });
    // Optimistically update gap to 'generating'
    set((state) => ({
      gaps: state.gaps.map((g) =>
        g.id === gapId ? { ...g, status: 'generating' as const } : g
      ),
    }));

    try {
      const res = await fetch('/api/pipeline-gaps/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gapId }),
      });

      if (res.ok) {
        const filledGap: PipelineGap = await res.json();
        set((state) => ({
          gaps: state.gaps.map((g) => (g.id === gapId ? filledGap : g)),
          filling: false,
        }));
      } else {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        console.error('Failed to fill gap:', errBody.error);
        // Revert optimistic update
        set((state) => ({
          gaps: state.gaps.map((g) =>
            g.id === gapId ? { ...g, status: 'fill-requested' as const } : g
          ),
          filling: false,
        }));
      }
    } catch (err) {
      console.error('Failed to fill gap:', err);
      // Revert optimistic update
      set((state) => ({
        gaps: state.gaps.map((g) =>
          g.id === gapId ? { ...g, status: 'fill-requested' as const } : g
        ),
        filling: false,
      }));
    }
  },
}));
