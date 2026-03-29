import type { SceneImage, VideoResult, GenerationBatch } from '@/types/replicate';
import type { SceneTemplate } from '@/lib/sceneStructure';
import { generateSceneStructure } from '@/lib/sceneStructure';
import { getImageModel, getVideoModel } from '@/lib/models';

// ─── Constants ─────────────────────────────────────────────────────

const CLIP_DURATION_SECONDS = 5;
const MAX_CLIPS_PER_BATCH = 4;
const MAX_REFERENCE_IMAGES = 7;

// ─── Long-Form Scene Planning ──────────────────────────────────────

/**
 * Calculates how many scene cycles are needed for a target duration.
 * A "cycle" is one pass through the scene structure template.
 * Each cycle produces clips based on pacing (5/6/10 scenes).
 */
export function planLongFormScenes(
  pacing: string,
  targetDurationMinutes: number,
): {
  totalScenes: number;
  cycles: number;
  estimatedDuration: number;
  structure: SceneTemplate[];
} {
  const baseStructure = generateSceneStructure(pacing);
  const scenesPerCycle = baseStructure.length;
  const durationPerCycle = baseStructure.reduce((sum, s) => sum + s.durationHint, 0);

  const targetSeconds = targetDurationMinutes * 60;
  const cycles = Math.max(1, Math.ceil(targetSeconds / durationPerCycle));
  const totalScenes = cycles * scenesPerCycle;

  // Build the full scene list by repeating the structure with unique IDs
  // and evolving narrative context per cycle
  const structure: SceneTemplate[] = [];
  for (let c = 0; c < cycles; c++) {
    for (let s = 0; s < baseStructure.length; s++) {
      const base = baseStructure[s];
      const globalIndex = c * scenesPerCycle + s;
      structure.push({
        ...base,
        id: `scene-${globalIndex + 1}`,
        // Evolve prompt suffix per cycle for narrative progression
        promptSuffix: evolvePromptForCycle(base.promptSuffix, base.narrativeRole, c, cycles),
      });
    }
  }

  return {
    totalScenes,
    cycles,
    estimatedDuration: totalScenes * CLIP_DURATION_SECONDS,
    structure,
  };
}

/**
 * Adds narrative progression context so repeated cycles don't produce
 * identical scenes — each cycle represents a story beat escalation.
 */
function evolvePromptForCycle(
  baseSuffix: string,
  role: string,
  cycle: number,
  totalCycles: number,
): string {
  if (totalCycles <= 1) return baseSuffix;

  const progressPct = cycle / (totalCycles - 1);
  const actLabel = progressPct < 0.33 ? 'early in the story, establishing tone'
    : progressPct < 0.66 ? 'midpoint of the narrative, rising tension'
    : 'approaching the finale, peak intensity';

  const escalation = cycle > 0
    ? `, building on previous events, ${actLabel}`
    : ', opening chapter';

  return `${baseSuffix}${escalation}`;
}

// ─── Batch Planning ────────────────────────────────────────────────

/**
 * Divides scenes into generation batches for sequential processing.
 * Each batch generates N scenes, then videos, then extracts the last frame
 * to anchor the next batch's continuity.
 */
export function planBatches(scenes: SceneTemplate[]): Omit<GenerationBatch, 'referenceImageUrls'>[] {
  const batches: Omit<GenerationBatch, 'referenceImageUrls'>[] = [];

  for (let i = 0; i < scenes.length; i += MAX_CLIPS_PER_BATCH) {
    const end = Math.min(i + MAX_CLIPS_PER_BATCH, scenes.length);
    batches.push({
      id: `batch-${batches.length + 1}`,
      sceneRange: [i, end - 1],
      status: 'pending',
      videoIds: scenes.slice(i, end).map((s) => `video-${s.id}`),
    });
  }

  return batches;
}

// ─── Multi-Prompt Batch Planning (Kling 3.0) ─────────────────────────

export interface MultiPromptBatch {
  id: string;
  sceneRange: [number, number];
  sceneIds: string[];
  totalDuration: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

const MAX_MULTI_PROMPT_SEGMENTS = 5;  // Leave margin from 6 limit
const MAX_MULTI_PROMPT_DURATION = 15;
const MIN_SEGMENT_DURATION = 3;

/**
 * Plans batches for Kling 3.0 multi_prompt mode.
 * Groups scenes respecting: max 5 per batch, max 15s total, min 3s per scene.
 * The model generates all shots in a batch as ONE coherent video.
 */
export function planMultiPromptBatches(
  scenes: { id: string; durationHint?: number }[],
): MultiPromptBatch[] {
  const batches: MultiPromptBatch[] = [];
  let currentIds: string[] = [];
  let currentDuration = 0;
  let startIdx = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sceneDuration = Math.max(MIN_SEGMENT_DURATION, scenes[i].durationHint ?? 3);

    const wouldExceedDuration = currentDuration + sceneDuration > MAX_MULTI_PROMPT_DURATION;
    const wouldExceedCount = currentIds.length >= MAX_MULTI_PROMPT_SEGMENTS;

    if ((wouldExceedDuration || wouldExceedCount) && currentIds.length > 0) {
      batches.push({
        id: `mp-batch-${batches.length + 1}`,
        sceneRange: [startIdx, startIdx + currentIds.length - 1],
        sceneIds: currentIds,
        totalDuration: currentDuration,
        status: 'pending',
      });
      currentIds = [];
      currentDuration = 0;
      startIdx = i;
    }

    currentIds.push(scenes[i].id);
    currentDuration += sceneDuration;
  }

  // Flush remaining
  if (currentIds.length > 0) {
    batches.push({
      id: `mp-batch-${batches.length + 1}`,
      sceneRange: [startIdx, startIdx + currentIds.length - 1],
      sceneIds: currentIds,
      totalDuration: currentDuration,
      status: 'pending',
    });
  }

  return batches;
}

// ─── Reference Image Selection ─────────────────────────────────────

/**
 * Selects the best reference images for a batch to maximize consistency.
 * Strategy: use anchor frame from previous batch + key character shots
 * from earlier batches (prioritize close-ups and character intros).
 */
export function selectReferenceImages(
  completedScenes: SceneImage[],
  anchorFrameUrl?: string,
): string[] {
  const refs: string[] = [];

  // Always include the anchor frame (last frame of previous batch) first
  if (anchorFrameUrl) {
    refs.push(anchorFrameUrl);
  }

  // Prioritize close-up and character shots for reference consistency
  const prioritized = [...completedScenes]
    .filter((s) => s.imageUrl)
    .sort((a, b) => {
      // Close-ups and character shots first
      const aScore = getConsistencyPriority(a.prompt);
      const bScore = getConsistencyPriority(b.prompt);
      return bScore - aScore;
    });

  for (const scene of prioritized) {
    if (refs.length >= MAX_REFERENCE_IMAGES) break;
    if (scene.imageUrl && !refs.includes(scene.imageUrl)) {
      refs.push(scene.imageUrl);
    }
  }

  return refs.slice(0, MAX_REFERENCE_IMAGES);
}

/**
 * Scores how important a scene is for character consistency reference.
 * Close-ups and character introductions are most valuable as references.
 */
function getConsistencyPriority(prompt: string): number {
  const lower = prompt.toLowerCase();
  let score = 0;
  if (lower.includes('close-up') || lower.includes('closeup')) score += 3;
  if (lower.includes('character') || lower.includes('face')) score += 2;
  if (lower.includes('portrait') || lower.includes('introduction')) score += 2;
  if (lower.includes('reaction')) score += 1;
  if (lower.includes('establishing') || lower.includes('aerial')) score -= 1;
  return score;
}

// ─── Continuity Validation ─────────────────────────────────────────

/**
 * Checks if a video result chain maintains continuity.
 * Returns issues that need regeneration.
 */
export function validateContinuity(
  videos: VideoResult[],
): { videoId: string; issue: string }[] {
  const issues: { videoId: string; issue: string }[] = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    // Check for failed videos that break the chain
    if (video.status === 'failed') {
      issues.push({
        videoId: video.id,
        issue: `Video failed: ${video.error ?? 'unknown error'}. Chain is broken at position ${i + 1}.`,
      });
    }

    // Check for missing last frame (needed for chaining)
    if (i < videos.length - 1 && video.status === 'completed' && !video.lastFrameUrl) {
      issues.push({
        videoId: video.id,
        issue: 'Missing last frame extraction — next clip cannot chain from this.',
      });
    }
  }

  return issues;
}

// ─── Duration Estimation ───────────────────────────────────────────

export function estimateTotalDuration(videos: VideoResult[]): number {
  return videos.reduce((sum, v) => sum + (v.durationSeconds ?? CLIP_DURATION_SECONDS), 0);
}

const IMAGE_COST_TIERS: Record<string, number> = {
  '$': 0.003,
  '$$': 0.01,
  '$$$': 0.05,
};

const VIDEO_COST_TIERS: Record<string, number> = {
  '$': 0.05,
  '$$': 0.10,
  '$$$': 0.25,
};

export function estimateCost(
  totalScenes: number,
  imageModelId?: string,
  videoModelId?: string,
): {
  imageCost: number;
  videoCost: number;
  totalCost: number;
} {
  // Look up cost tiers from model definitions
  const imageModel = imageModelId ? getImageModel(imageModelId) : undefined;
  const videoModel = videoModelId ? getVideoModel(videoModelId) : undefined;

  const imageTier = imageModel?.costTier ?? '$$';
  const videoTier = videoModel?.costTier ?? '$$$';

  const perImage = IMAGE_COST_TIERS[imageTier] ?? 0.01;
  const perVideo = VIDEO_COST_TIERS[videoTier] ?? 0.10;

  const imageCost = totalScenes * perImage;
  const videoCost = totalScenes * perVideo;

  return {
    imageCost: Math.round(imageCost * 100) / 100,
    videoCost: Math.round(videoCost * 100) / 100,
    totalCost: Math.round((imageCost + videoCost) * 100) / 100,
  };
}

export { MAX_CLIPS_PER_BATCH, MAX_REFERENCE_IMAGES, CLIP_DURATION_SECONDS };
