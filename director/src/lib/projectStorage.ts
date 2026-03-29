import type { WizardState } from '@/context/WizardContext';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SavedProject {
  id: string;
  title: string;
  updatedAt: string;
  state: WizardState;
}

export interface ProjectIndexEntry {
  id: string;
  title: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const INDEX_KEY = 'director-projects-index';
const PROJECT_PREFIX = 'director-project-';
const AUTOSAVE_KEY = 'director-autosave';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__ls_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/** Strip trainingImages (File objects cannot be serialized) */
function serializableState(state: WizardState): WizardState {
  return {
    ...state,
    trainingImages: [],
    // Deduplicate scenes and videos before persisting
    scenes: state.scenes.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i),
    videoResults: state.videoResults.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i),
  };
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded — try to free space by removing old projects
    try {
      const index = readIndex();
      if (index.length > 1) {
        const oldest = index.pop()!;
        localStorage.removeItem(projectKey(oldest.id));
        writeIndex(index);
        localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Nothing we can do
    }
    console.warn(`[projectStorage] localStorage quota exceeded for key: ${key}`);
    return false;
  }
}

function readIndex(): ProjectIndexEntry[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectIndexEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: ProjectIndexEntry[]): void {
  safeSetItem(INDEX_KEY, JSON.stringify(entries));
}

function projectKey(id: string): string {
  return `${PROJECT_PREFIX}${id}`;
}

function deriveId(baseSeed: number): string {
  return `proj-${baseSeed}`;
}

function deriveTitle(state: WizardState): string {
  const text = state.visionText.trim();
  if (text.length === 0) return 'Untitled Project';
  return text.length > 60 ? text.slice(0, 57) + '...' : text;
}

// ── Debounce ─────────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ── Core save (single implementation) ────────────────────────────────────────

function persistProject(state: WizardState): void {
  const id = deriveId(state.baseSeed);
  const title = deriveTitle(state);
  const updatedAt = new Date().toISOString();
  const saved: SavedProject = {
    id,
    title,
    updatedAt,
    state: serializableState(state),
  };

  safeSetItem(projectKey(id), JSON.stringify(saved));

  // Derive thumbnail from first completed scene or production asset
  const firstScene = state.scenes?.find((s) => s.status === 'completed' && s.imageUrl);
  const firstAsset = state.productionAssets?.find((a) => a.status === 'succeeded' && a.imageUrl);
  const thumbnailUrl = firstScene?.imageUrl ?? firstAsset?.imageUrl ?? undefined;

  // Update index
  const index = readIndex();
  const existing = index.findIndex((e) => e.id === id);
  const entry: ProjectIndexEntry = { id, title, updatedAt, thumbnailUrl };
  if (existing >= 0) {
    index[existing] = entry;
  } else {
    index.unshift(entry);
  }
  writeIndex(index);

  // Also write to autosave slot
  safeSetItem(AUTOSAVE_KEY, JSON.stringify(saved));
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a project to localStorage. Internally debounced at 500ms so rapid
 * `update()` calls don't hammer storage.
 */
export function saveProject(state: WizardState): void {
  if (!isLocalStorageAvailable()) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    persistProject(state);
  }, 500);
}

/**
 * Save immediately (no debounce) — useful when user explicitly saves.
 */
export function saveProjectImmediate(state: WizardState): void {
  if (!isLocalStorageAvailable()) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  persistProject(state);
}

/**
 * Load a saved project by id.
 */
export function loadProject(id: string): WizardState | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(projectKey(id));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProject;
    return { ...saved.state, trainingImages: [] };
  } catch {
    return null;
  }
}

/**
 * Return the index of all saved projects (lightweight — no full state).
 */
export function listProjects(): ProjectIndexEntry[] {
  return readIndex().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/**
 * Delete a project and ALL associated data from storage.
 *
 * Cleans up:
 * - Project state in localStorage
 * - Project index entry
 * - Autosave slot (if it matches)
 * - Associated pipeline(s)
 * - In-flight Replicate predictions (best-effort cancel)
 */
export function deleteProject(id: string): void {
  if (!isLocalStorageAvailable()) return;

  // Load project state before removing so we can clean up associated data
  let projectState: WizardState | null = null;
  try {
    const raw = localStorage.getItem(projectKey(id));
    if (raw) {
      const saved = JSON.parse(raw) as SavedProject;
      projectState = saved.state;
    }
  } catch {
    // Continue with deletion even if we can't load state
  }

  // 1. Remove the project data
  localStorage.removeItem(projectKey(id));

  // 2. Update index
  const index = readIndex().filter((e) => e.id !== id);
  writeIndex(index);

  // 3. Clear autosave if it matches
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SavedProject;
      if (saved.id === id) {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  } catch {
    // ignore
  }

  // 4. Delete associated pipeline(s) — inline to avoid cross-module import issues
  if (projectState?.activePipelineId) {
    try {
      const pipelineKey = `director-pipeline-${projectState.activePipelineId}`;
      localStorage.removeItem(pipelineKey);
      // Update pipeline index
      const pipelineIndexRaw = localStorage.getItem('director-pipelines-index');
      if (pipelineIndexRaw) {
        const pipelineIndex = JSON.parse(pipelineIndexRaw) as { id: string }[];
        const filtered = pipelineIndex.filter((e) => e.id !== projectState!.activePipelineId);
        localStorage.setItem('director-pipelines-index', JSON.stringify(filtered));
      }
    } catch {
      // Pipeline may already be gone
    }
  }

  // 5. Cancel in-flight Replicate predictions (best-effort, fire-and-forget)
  if (projectState) {
    const predictionIds = collectActivePredictions(projectState);
    for (const pid of predictionIds) {
      fetch(`/api/status/${pid}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

/**
 * Collect all prediction IDs that may still be in-flight from a project state.
 */
function collectActivePredictions(state: WizardState): string[] {
  const ids: string[] = [];

  // Scene image predictions still generating
  for (const scene of state.scenes ?? []) {
    if (scene.predictionId && scene.status === 'generating') {
      ids.push(scene.predictionId);
    }
  }

  // Video predictions still generating or pending
  for (const video of state.videoResults ?? []) {
    if (video.predictionId && (video.status === 'generating' || video.status === 'pending')) {
      ids.push(video.predictionId);
    }
  }

  // Training prediction
  if (state.trainingId && state.trainingStatus?.status !== 'succeeded' && state.trainingStatus?.status !== 'failed') {
    ids.push(state.trainingId);
  }

  // Production asset predictions still generating
  for (const asset of state.productionAssets ?? []) {
    if (asset.predictionId && asset.status === 'generating') {
      ids.push(asset.predictionId);
    }
  }

  return ids;
}

/**
 * Load the auto-save slot (last project the user was working on).
 */
export function getAutoSave(): WizardState | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProject;
    return { ...saved.state, trainingImages: [] };
  } catch {
    return null;
  }
}

/**
 * Clear the auto-save slot.
 */
export function clearAutoSave(): void {
  if (!isLocalStorageAvailable()) return;
  localStorage.removeItem(AUTOSAVE_KEY);
}
