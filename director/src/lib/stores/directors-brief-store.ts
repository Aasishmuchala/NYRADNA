import { create } from 'zustand';
import {
  DirectorsBrief,
  Storyline,
  VisualStyle,
  NarrativeBeat,
} from '../types/directors-brief';

const EMPTY_BRIEF: Omit<DirectorsBrief, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> = {
  storyline: { title: '', synopsis: '', theme: '' },
  visualStyle: { mood: '', colorPalette: [], cinematographyRefs: [] },
  narrativeBeats: { beats: [] },
};

interface DirectorsBriefState {
  brief: DirectorsBrief | null;
  loading: boolean;
  saving: boolean;
  lastSavedAt: string | null;

  // Form mutations
  updateStoryline: (updates: Partial<Storyline>) => void;
  updateVisualStyle: (updates: Partial<VisualStyle>) => void;
  addColorToPalette: (color: string) => void;
  removeColorFromPalette: (index: number) => void;
  addCinematographyRef: (ref: string) => void;
  removeCinematographyRef: (index: number) => void;
  addBeat: (beat: NarrativeBeat) => void;
  updateBeat: (index: number, updates: Partial<NarrativeBeat>) => void;
  removeBeat: (index: number) => void;

  // Persistence
  loadBrief: (projectId: string) => Promise<void>;
  saveBrief: () => Promise<void>;

  // Reset
  resetBrief: () => void;
}

export const useDirectorsBriefStore = create<DirectorsBriefState>()((set, get) => ({
  brief: null,
  loading: false,
  saving: false,
  lastSavedAt: null,

  updateStoryline: (updates: Partial<Storyline>) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        storyline: { ...brief.storyline, ...updates },
      },
    });
  },

  updateVisualStyle: (updates: Partial<VisualStyle>) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        visualStyle: { ...brief.visualStyle, ...updates },
      },
    });
  },

  addColorToPalette: (color: string) => {
    const { brief } = get();
    if (!brief) return;
    if (brief.visualStyle.colorPalette.length >= 8) return;
    set({
      brief: {
        ...brief,
        visualStyle: {
          ...brief.visualStyle,
          colorPalette: [...brief.visualStyle.colorPalette, color],
        },
      },
    });
  },

  removeColorFromPalette: (index: number) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        visualStyle: {
          ...brief.visualStyle,
          colorPalette: brief.visualStyle.colorPalette.filter((_, i) => i !== index),
        },
      },
    });
  },

  addCinematographyRef: (ref: string) => {
    const { brief } = get();
    if (!brief) return;
    if (brief.visualStyle.cinematographyRefs.length >= 5) return;
    set({
      brief: {
        ...brief,
        visualStyle: {
          ...brief.visualStyle,
          cinematographyRefs: [...brief.visualStyle.cinematographyRefs, ref],
        },
      },
    });
  },

  removeCinematographyRef: (index: number) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        visualStyle: {
          ...brief.visualStyle,
          cinematographyRefs: brief.visualStyle.cinematographyRefs.filter((_, i) => i !== index),
        },
      },
    });
  },

  addBeat: (beat: NarrativeBeat) => {
    const { brief } = get();
    if (!brief) return;
    if (brief.narrativeBeats.beats.length >= 12) return;
    set({
      brief: {
        ...brief,
        narrativeBeats: {
          beats: [...brief.narrativeBeats.beats, beat],
        },
      },
    });
  },

  updateBeat: (index: number, updates: Partial<NarrativeBeat>) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        narrativeBeats: {
          beats: brief.narrativeBeats.beats.map((beat, i) =>
            i === index ? { ...beat, ...updates } : beat
          ),
        },
      },
    });
  },

  removeBeat: (index: number) => {
    const { brief } = get();
    if (!brief) return;
    set({
      brief: {
        ...brief,
        narrativeBeats: {
          beats: brief.narrativeBeats.beats
            .filter((_, i) => i !== index)
            .map((beat, i) => ({ ...beat, segmentIndex: i + 1 })),
        },
      },
    });
  },

  loadBrief: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/briefs?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data: DirectorsBrief = await res.json();
        set({ brief: data, loading: false });
      } else if (res.status === 404) {
        // No existing brief -- initialize a blank one
        const now = new Date().toISOString();
        const blank: DirectorsBrief = {
          id: crypto.randomUUID(),
          projectId,
          ...EMPTY_BRIEF,
          createdAt: now,
          updatedAt: now,
        };
        set({ brief: blank, loading: false });
      } else {
        console.error('Failed to load brief:', res.statusText);
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load brief:', err);
      // Initialize blank brief on network error so form is usable
      const now = new Date().toISOString();
      const blank: DirectorsBrief = {
        id: crypto.randomUUID(),
        projectId,
        ...EMPTY_BRIEF,
        createdAt: now,
        updatedAt: now,
      };
      set({ brief: blank, loading: false });
    }
  },

  saveBrief: async () => {
    const { brief } = get();
    if (!brief) return;
    set({ saving: true });
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      if (res.ok) {
        set({ saving: false, lastSavedAt: new Date().toISOString() });
      } else {
        console.error('Failed to save brief:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to save brief:', err);
      set({ saving: false });
    }
  },

  resetBrief: () => {
    set({ brief: null, loading: false, saving: false, lastSavedAt: null });
  },
}));
