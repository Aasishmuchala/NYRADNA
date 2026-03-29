// ─── Pipeline Serialization ─────────────────────────────────────────
//
// Save/load pipeline graphs to localStorage.
// Same pattern as projectStorage.ts.

import type { PipelineGraph } from './graph';
import { resetRuntimeState } from './graph';

const INDEX_KEY = 'director-pipelines-index';
const PREFIX = 'director-pipeline-';

interface PipelineEntry {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}

/** Get list of saved pipelines */
export function listSavedPipelines(): PipelineEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown) => typeof e === 'object' && e !== null && typeof (e as PipelineEntry).id === 'string',
    ) as PipelineEntry[];
  } catch {
    return [];
  }
}

/** Save a pipeline graph */
export function savePipeline(graph: PipelineGraph): void {
  if (typeof window === 'undefined') return;

  // Strip runtime state before saving
  const clean = resetRuntimeState(graph);
  const saved = {
    ...clean,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${PREFIX}${graph.id}`, JSON.stringify(saved));

  // Update index
  const index = listSavedPipelines();
  const existing = index.findIndex((e) => e.id === graph.id);
  const entry: PipelineEntry = {
    id: graph.id,
    name: graph.name,
    description: graph.description,
    updatedAt: saved.updatedAt,
  };

  if (existing >= 0) {
    index[existing] = entry;
  } else {
    index.push(entry);
  }

  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Load a pipeline graph by ID */
export function loadPipeline(id: string): PipelineGraph | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate essential structure
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof parsed.id !== 'string' ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.edges)
    ) {
      console.warn(`[Pipeline] Invalid pipeline data for ${id}, ignoring`);
      return null;
    }
    return parsed as PipelineGraph;
  } catch {
    return null;
  }
}

/** Delete a pipeline */
export function deletePipeline(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PREFIX}${id}`);

  const index = listSavedPipelines().filter((e) => e.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}
