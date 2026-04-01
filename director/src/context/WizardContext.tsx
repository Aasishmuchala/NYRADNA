'use client';

import { createContext, useContext, useState, useCallback, useRef, useMemo, ReactNode, useEffect } from 'react';
import type { TrainingStatus, SceneImage, VideoResult, GenerationBatch } from '@/types/replicate';
import type { NarrativeContext } from '@/lib/narrativeMemory';
import { getLoraCompatibleModels, getBestModelForLora } from '@/lib/models';
import { saveProject, saveProjectImmediate, loadProject, getAutoSave, clearAutoSave } from '@/lib/projectStorage';

export type AssetCategory = 'character' | 'prop' | 'wardrobe' | 'location' | 'vehicle' | 'accessory';

export interface LoraProfile {
  id: string;
  name: string;
  triggerWord: string;
  loraUrl: string;
  scale: number; // 0.0 - 1.0, default 0.8
  trainedAt: number; // timestamp
}

export interface ProductionAsset {
  id: string;
  category: AssetCategory;
  name: string;
  description: string;
  imageUrl: string | null;
  predictionId: string | null;
  status: 'idle' | 'generating' | 'succeeded' | 'failed';
  model: string;
  shots?: { id: string; label: string; imageUrl: string | null; status: string }[];
}

export interface WizardState {
  // Step 1: Intent
  visionText: string;
  // Step 2: Brief
  selectedPersona: number | null;
  customPersonaTitle: string;
  customPersonaDescription: string;
  customPersonaTone: string;
  customPersonaAtmosphere: string;
  // Step 3: Style DNA
  colorIndex: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  pacing: 'quick' | 'balanced' | 'slow';
  lighting: 'warm' | 'cool' | 'high-contrast' | 'mood';
  cameraMotion: string;
  // Step 4: Character & Asset Setup
  characterTab: 'real' | 'ai';
  characterName: string;
  characterGender: string;
  aiDescription: string;
  aiCharacterImageUrl: string | null;
  aiCharacterModel: string;
  // Production assets (characters, props, wardrobe, locations, vehicles)
  productionAssets: ProductionAsset[];
  // Step 5: Review
  selectedScene: string;
  // Step 6: Generating
  isPaused: boolean;
  // Step 7: Export
  exportFormat: string;
  exportResolution: string;
  includeAudio: boolean;
  includeSubtitles: boolean;

  // Training state
  trainingImages: File[];
  trainingId: string | null;
  trainingStatus: TrainingStatus | null;
  loraUrl: string | null;
  triggerWord: string;

  // Multi-LoRA profiles (trained characters)
  loraProfiles: LoraProfile[];
  activeLoraIds: string[]; // which LoRAs to blend during generation

  // Video LoRA (CogVideoX / Hunyuan trained weights)
  videoLoraUrl: string | null;

  // Scene generation state
  scenes: SceneImage[];
  activeSceneId: string | null;

  // Video generation state
  videoResults: VideoResult[];
  activeVideoId: string | null;

  // Edit state
  editingSceneId: string | null;
  editMaskUrl: string | null;

  // Model selection
  selectedImageModel: string;
  selectedVideoModel: string;

  // Seed for visual consistency
  baseSeed: number;

  // Style lock — hero reference images sent to every video for consistency
  styleLockImages: string[];

  // Long-form generation
  targetDurationMinutes: number;
  generationBatches: GenerationBatch[];
  currentBatchIndex: number;

  // Audio & Music
  selectedSoundtrack: string;
  voiceoverScript: string;
  voiceoverUrl: string | null;

  // Character consistency lock — frozen physical description prepended to every prompt
  characterDescriptionLock: string;

  // Narrative memory — carries story context across scenes and batches
  narrativeContext: NarrativeContext | null;

  // Pipeline editor
  pipelineMode: 'simple' | 'node';
  activePipelineId: string | null;
  finalVideoUrl: string | null;

  // Ultra Mode
  ultraModeEnabled: boolean;
  controlSourceType: 'ai-estimate' | '3d-composer' | 'upload';
}

const defaultState: WizardState = {
  visionText: '',
  selectedPersona: null,
  customPersonaTitle: '',
  customPersonaDescription: '',
  customPersonaTone: '',
  customPersonaAtmosphere: '',
  colorIndex: 0,
  aspectRatio: '16:9',
  pacing: 'balanced',
  lighting: 'high-contrast',
  cameraMotion: 'Handheld Cinematic',
  characterTab: 'real',
  characterName: '',
  characterGender: 'male',
  aiDescription: '',
  aiCharacterImageUrl: null,
  aiCharacterModel: 'flux-schnell',
  productionAssets: [],
  selectedScene: 'scene-01',
  isPaused: false,
  exportFormat: 'mp4',
  exportResolution: '1080p',
  includeAudio: true,
  includeSubtitles: true,

  trainingImages: [],
  trainingId: null,
  trainingStatus: null,
  loraUrl: null,
  triggerWord: 'DIRECTOR_CHAR',

  loraProfiles: [],
  activeLoraIds: [],

  videoLoraUrl: null,

  scenes: [],
  activeSceneId: null,

  videoResults: [],
  activeVideoId: null,

  editingSceneId: null,
  editMaskUrl: null,

  selectedImageModel: 'flux-dev-lora',
  selectedVideoModel: 'kling-3.0',

  baseSeed: Math.floor(Math.random() * 2147483647),

  styleLockImages: [],

  targetDurationMinutes: 3,
  generationBatches: [],
  currentBatchIndex: 0,

  selectedSoundtrack: 'none',
  voiceoverScript: '',
  voiceoverUrl: null,

  characterDescriptionLock: '',

  narrativeContext: null,

  pipelineMode: 'simple',
  activePipelineId: null,
  finalVideoUrl: null,

  ultraModeEnabled: false,
  controlSourceType: 'ai-estimate',
};

interface WizardContextType {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  reset: () => void;
  resetWithoutSave: () => void;
  hardReset: () => void;
  saveAsProject: () => void;
  loadFromProject: (id: string) => boolean;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState);
  const hasHydrated = useRef(false);

  // On initial mount, restore from auto-save if available
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const saved = getAutoSave();
    if (saved) {
      // Reset any stuck 'generating' or 'pending' items to 'failed' since polling doesn't resume across sessions
      if (saved.scenes) {
        saved.scenes = saved.scenes.map((s) =>
          s.status === 'generating' ? { ...s, status: 'failed' as const, error: 'Generation interrupted — please retry' } : s
        );
      }
      if (saved.videoResults) {
        saved.videoResults = saved.videoResults.map((v) =>
          v.status === 'generating' || v.status === 'pending'
            ? { ...v, status: 'failed' as const, error: 'Generation interrupted — please retry' }
            : v
        );
      }
      setState((prev) => ({ ...prev, ...saved, trainingImages: [] }));
    }
  }, []);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      // Auto-switch to LoRA-compatible model when LoRA URL is set
      if (partial.loraUrl && partial.loraUrl !== prev.loraUrl) {
        const loraModels = getLoraCompatibleModels();
        const currentIsLora = loraModels.some((m) => m.id === next.selectedImageModel);
        if (!currentIsLora) {
          next.selectedImageModel = getBestModelForLora().id;
        }
        // Auto-add to LoRA profiles when a new training completes
        const alreadySaved = next.loraProfiles.some((p) => p.loraUrl === partial.loraUrl);
        if (!alreadySaved) {
          const profile: LoraProfile = {
            id: `lora-${Date.now()}`,
            name: next.triggerWord || 'Character',
            triggerWord: next.triggerWord,
            loraUrl: partial.loraUrl,
            scale: 0.8,
            trainedAt: Date.now(),
          };
          next.loraProfiles = [...next.loraProfiles, profile];
          next.activeLoraIds = [...next.activeLoraIds, profile.id];
        }
      }
      // Deduplicate scenes and videoResults to prevent key collisions (O(n) via Set)
      if (partial.scenes) {
        const seen = new Set<string>();
        next.scenes = next.scenes.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      }
      if (partial.videoResults) {
        const seen = new Set<string>();
        next.videoResults = next.videoResults.filter((v) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });
      }
      // Persist to localStorage (debounced)
      saveProject(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    // Save current project before resetting so no work is lost
    setState((prev) => {
      if (prev.visionText || prev.productionAssets.length > 0 || prev.scenes.length > 0) {
        saveProjectImmediate(prev);
      }
      return {
        ...defaultState,
        baseSeed: Math.floor(Math.random() * 2147483647),
      };
    });
    clearAutoSave();
  }, []);

  /** Reset state without saving — used after project deletion to avoid re-creating the deleted project. */
  const resetWithoutSave = useCallback(() => {
    setState({
      ...defaultState,
      baseSeed: Math.floor(Math.random() * 2147483647),
    });
    clearAutoSave();
  }, []);

  const hardReset = useCallback(() => {
    // Nuclear option: wipe ALL director data from localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('director-') || key.startsWith('director_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
    setState({
      ...defaultState,
      baseSeed: Math.floor(Math.random() * 2147483647),
    });
  }, []);

  const saveAsProject = useCallback(() => {
    saveProjectImmediate(state);
  }, [state]);

  const loadFromProject = useCallback((id: string): boolean => {
    const loaded = loadProject(id);
    if (!loaded) return false;
    if (loaded.scenes) {
      loaded.scenes = loaded.scenes.map((s) =>
        s.status === 'generating' ? { ...s, status: 'failed' as const, error: 'Generation interrupted — please retry' } : s
      );
    }
    if (loaded.videoResults) {
      loaded.videoResults = loaded.videoResults.map((v) =>
        v.status === 'generating' || v.status === 'pending'
          ? { ...v, status: 'failed' as const, error: 'Generation interrupted — please retry' }
          : v
      );
    }
    setState({ ...loaded, trainingImages: [] });
    return true;
  }, []);

  const contextValue = useMemo(
    () => ({ state, update, reset, resetWithoutSave, hardReset, saveAsProject, loadFromProject }),
    [state, update, reset, resetWithoutSave, hardReset, saveAsProject, loadFromProject],
  );

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
