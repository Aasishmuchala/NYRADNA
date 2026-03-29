/**
 * Unified reference image builder.
 *
 * Builds an ordered array of reference images (characters first, environments second)
 * plus a tag map so prompts can use <<<image_N>>> tags for Kling 3.0 consistency.
 *
 * `subject_reference` does NOT exist on Replicate's Kling model — everything goes
 * into `reference_images` (max 7). Character images go first so they get lower
 * <<<image_N>>> numbers (more prominent in the model's attention).
 */

import type { ProductionAsset } from '@/context/WizardContext';

export interface ReferenceImageSet {
  referenceImages: string[];           // All refs ordered: characters first, environments second, style last
  tagMap: Map<string, string>;         // assetId → '<<<image_N>>>' for prompt injection
  characterCount: number;
  environmentCount: number;
}

interface RefBuildInput {
  productionAssets?: ProductionAsset[];
  aiCharacterImageUrl?: string | null;
  styleLockImages?: string[];
}

/**
 * Build a unified, ordered reference image set from wizard state.
 *
 * Order: character assets (max 3) → location assets (max 2) → style lock images → remaining
 * Total max: 7 (Kling 3.0 limit)
 *
 * The tagMap maps asset IDs to <<<image_N>>> tags (1-indexed by position in the array).
 * Use these tags in video prompts so Kling knows which reference image is which.
 */
export function buildReferenceImageSet(state: RefBuildInput): ReferenceImageSet {
  const refs: string[] = [];
  const tagMap = new Map<string, string>();
  const MAX_REFS = 7;
  const MAX_CHARACTER = 3;
  const MAX_LOCATION = 2;

  const assets = state.productionAssets || [];
  const succeededAssets = assets.filter(a => a.status === 'succeeded' && a.imageUrl);

  // 1. Character assets first (most important for face lock)
  const characterAssets = succeededAssets.filter(a => a.category === 'character');
  for (const asset of characterAssets) {
    if (refs.length >= MAX_CHARACTER || refs.length >= MAX_REFS) break;
    if (asset.imageUrl && !refs.includes(asset.imageUrl)) {
      refs.push(asset.imageUrl);
      tagMap.set(asset.id, `<<<image_${refs.length}>>>`);
    }
  }

  // 2. AI character image as fallback if no character production assets
  if (refs.length === 0 && state.aiCharacterImageUrl) {
    refs.push(state.aiCharacterImageUrl);
    tagMap.set('ai-character', `<<<image_${refs.length}>>>`);
  }

  const characterCount = refs.length;

  // 3. Location/environment assets next
  const locationAssets = succeededAssets.filter(a => a.category === 'location');
  for (const asset of locationAssets) {
    if (refs.length >= characterCount + MAX_LOCATION || refs.length >= MAX_REFS) break;
    if (asset.imageUrl && !refs.includes(asset.imageUrl)) {
      refs.push(asset.imageUrl);
      tagMap.set(asset.id, `<<<image_${refs.length}>>>`);
    }
  }

  const environmentCount = refs.length - characterCount;

  // 4. Other production assets (wardrobe, props, vehicles)
  const otherAssets = succeededAssets.filter(a =>
    a.category !== 'character' && a.category !== 'location'
  );
  for (const asset of otherAssets) {
    if (refs.length >= MAX_REFS) break;
    if (asset.imageUrl && !refs.includes(asset.imageUrl)) {
      refs.push(asset.imageUrl);
      tagMap.set(asset.id, `<<<image_${refs.length}>>>`);
    }
  }

  // 5. Style lock images fill remaining slots
  const styleLock = state.styleLockImages || [];
  for (const url of styleLock) {
    if (refs.length >= MAX_REFS) break;
    if (!refs.includes(url)) {
      refs.push(url);
    }
  }

  return {
    referenceImages: refs,
    tagMap,
    characterCount,
    environmentCount,
  };
}

// ─── Backward compat re-export ──────────────────────────────────────
// Some callers still use the old interface during migration.
// This adapter converts the new format to the old shape.

export interface SubjectAndStyleRefs {
  subjectReferenceImages: string[];
  referenceImages: string[];
}

export function buildSubjectAndStyleRefs(state: RefBuildInput): SubjectAndStyleRefs {
  const result = buildReferenceImageSet(state);
  // For backward compat: character refs are "subject", rest are "style"
  return {
    subjectReferenceImages: result.referenceImages.slice(0, result.characterCount),
    referenceImages: result.referenceImages.slice(result.characterCount),
  };
}
