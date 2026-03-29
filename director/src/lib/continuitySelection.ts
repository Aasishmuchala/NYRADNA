/**
 * Cinematic Continuity Engine
 *
 * Selects, filters, and orders visual assets into a coherent narrative sequence.
 * Uses vision model analysis for accurate scoring, with keyword fallback.
 * Acts as a film director — continuity > individual quality.
 */

import type { SceneImage } from '@/types/replicate';
import type { ProductionAsset, WizardState } from '@/context/WizardContext';
import { buildCinematicPrompt } from '@/lib/cinematicPrompt';
import type { SceneAnalysis } from '@/app/api/analyze-scene/route';

// ─── Types ───────────────────────────────────────────────────────

type Emotion = 'calm' | 'curious' | 'tense' | 'intense' | 'triumphant' | 'reflective' | 'energetic' | 'mysterious';
type CameraSize = 'wide' | 'medium' | 'close' | 'extreme-close' | 'aerial';

interface NarrativeSlot {
  scene: number;
  type: 'intro' | 'build' | 'develop' | 'tension' | 'climax' | 'resolve' | 'closing';
  emotion: Emotion;
  camera: CameraSize;
  act: 1 | 2 | 3;
  promptSuffix: string;
}

interface AssetProfile {
  asset: ProductionAsset;
  emotion: Emotion;
  camera: CameraSize;
  lighting: string;
  poseRelevance: number;
  characterConsistency: number;
  compositionQuality: number;
  narrativeStrength: number;
  colorTemperature: string;
  depthOfField: string;
  sceneType: string;
  briefDescription: string;
  analysisSource: 'vision' | 'heuristic';
}

interface ScoredCandidate {
  asset: ProductionAsset;
  profile: AssetProfile;
  score: number;
  breakdown: {
    emotionMatch: number;
    cameraMatch: number;
    lightingMatch: number;
    characterConsistency: number;
    poseRelevance: number;
    compositionQuality: number;
    narrativeStrength: number;
  };
}

export interface SelectedScene {
  scene: number;
  selectedAsset: ProductionAsset;
  reason: string;
  score: number;
  videoMotionPrompt: string;
  analysis?: AssetProfile;
  rejection?: RejectionResult;
}

// ─── Rejection + Regeneration Types ─────────────────────────────

// Exported for use in review page and generation hooks
export type ConditioningRole =
  | 'primary_character_reference'
  | 'style_dna_reference'
  | 'continuity_reference_prev'
  | 'continuity_reference_next';

export interface ReferenceImage {
  imageId: string;
  asset: ProductionAsset;
  usage: ConditioningRole;
  reason: string;
  score: number;
  weight: number;
}

export interface ConditioningInputs {
  primary_character_reference: { imageId: string; weight: number; imageUrl: string } | null;
  style_dna_reference: { imageId: string; weight: number; imageUrl: string } | null;
  continuity_reference_prev: { imageId: string; weight: number; imageUrl: string } | null;
  continuity_reference_next: { imageId: string; weight: number; imageUrl: string } | null;
}

export interface RejectionResult {
  imageId: string;
  status: 'rejected';
  reasons: string[];
  referenceImages: ReferenceImage[];
  conditioningInputs: ConditioningInputs;
  regenerationPrompt: string;
  slot: NarrativeSlot;
  originalScore: number;
  retryCount: number;
}

// Conditioning weight distribution per the spec
const CONDITIONING_WEIGHTS = {
  primary_character_reference: 0.40,
  style_dna_reference: 0.25,
  continuity_reference_prev: 0.20,
  continuity_reference_next: 0.10,
  // prompt_specific_correction: 0.05 (implicit in prompt text)
};

// Escalation: if regeneration fails, increase character weight
const ESCALATED_WEIGHTS = {
  primary_character_reference: 0.50,
  style_dna_reference: 0.25,
  continuity_reference_prev: 0.15,
  continuity_reference_next: 0.10,
};

const REJECTION_THRESHOLDS = {
  characterConsistency: 0.90,
  minOverallScore: 0.35,
  emotionMatchFloor: 0.2,
  cameraMatchFloor: 0.2,
  compositionQualityFloor: 0.4,
};

// ─── Scene ID Helper ────────────────────────────────────────────

/** Single source of truth for converting an asset ID to a scene ID */
export function assetSceneId(assetId: string): string {
  // Asset IDs already start with "asset-" — avoid double-prefix
  return assetId.startsWith('asset-') ? `scene-${assetId}` : `asset-${assetId}`;
}

// ─── Scoring Weights ─────────────────────────────────────────────

const WEIGHTS = {
  emotionMatch: 0.25,
  cameraMatch: 0.20,
  lightingMatch: 0.10,
  characterConsistency: 0.15,
  poseRelevance: 0.05,
  compositionQuality: 0.15,
  narrativeStrength: 0.10,
};

const MIN_CHARACTER_CONSISTENCY = 0.85;

// ─── Vision Model Analysis ───────────────────────────────────────

/**
 * Analyze a single image via the vision API. Returns null on failure.
 */
async function analyzeImage(
  imageUrl: string,
  _openrouterKey?: string,
): Promise<SceneAnalysis | null> {
  try {
    const res = await fetch('/api/analyze-scene', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Analyze all assets sequentially (rate-limit friendly).
 * Calls onProgress after each analysis completes.
 */
export async function analyzeAllAssets(
  assets: ProductionAsset[],
  openrouterKey: string,
  onProgress?: (completed: number, total: number, assetName: string) => void,
): Promise<Map<string, SceneAnalysis>> {
  const results = new Map<string, SceneAnalysis>();
  const toAnalyze = assets.filter((a) => a.status === 'succeeded' && a.imageUrl);

  for (let i = 0; i < toAnalyze.length; i++) {
    const asset = toAnalyze[i];
    onProgress?.(i, toAnalyze.length, asset.name);

    const analysis = await analyzeImage(asset.imageUrl!, openrouterKey);
    if (analysis) {
      results.set(asset.id, analysis);
    }

    // Small delay between requests
    if (i < toAnalyze.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  onProgress?.(toAnalyze.length, toAnalyze.length, 'Done');
  return results;
}

// ─── Asset Profiling ─────────────────────────────────────────────

function profileAsset(
  asset: ProductionAsset,
  visionAnalysis?: SceneAnalysis,
): AssetProfile {
  if (visionAnalysis) {
    return profileFromVision(asset, visionAnalysis);
  }
  return profileFromHeuristics(asset);
}

function profileFromVision(asset: ProductionAsset, analysis: SceneAnalysis): AssetProfile {
  const poseMap: Record<string, number> = {
    dynamic: 0.95, action: 0.9, candid: 0.7, posed: 0.6, still: 0.4,
  };

  return {
    asset,
    emotion: analysis.emotion as Emotion,
    camera: analysis.camera as CameraSize,
    lighting: analysis.lighting,
    poseRelevance: poseMap[analysis.pose] ?? 0.5,
    characterConsistency: analysis.character_consistency,
    compositionQuality: analysis.composition_quality,
    narrativeStrength: analysis.narrative_strength,
    colorTemperature: analysis.color_temperature,
    depthOfField: analysis.depth_of_field,
    sceneType: analysis.scene_type,
    briefDescription: analysis.brief_description,
    analysisSource: 'vision',
  };
}

function profileFromHeuristics(asset: ProductionAsset): AssetProfile {
  const desc = (asset.description || '').toLowerCase();
  const category = asset.category;

  const cameraByCat: Record<string, CameraSize> = {
    character: 'close', location: 'wide', wardrobe: 'medium',
    prop: 'extreme-close', vehicle: 'wide', accessory: 'extreme-close',
  };

  const poseByCat: Record<string, number> = {
    character: 0.9, location: 0.3, wardrobe: 0.7,
    prop: 0.4, vehicle: 0.6, accessory: 0.3,
  };

  return {
    asset,
    emotion: inferEmotionFromKeywords(desc, category),
    camera: cameraByCat[category] || 'medium',
    lighting: inferLightingFromKeywords(desc),
    poseRelevance: poseByCat[category] ?? 0.5,
    characterConsistency: category === 'character'
      ? Math.min(0.95, 0.85 + (desc.length > 50 ? 0.05 : 0) + (desc.length > 100 ? 0.05 : 0))
      : 0.90,
    compositionQuality: 0.7,
    narrativeStrength: 0.5,
    colorTemperature: 'neutral',
    depthOfField: category === 'character' ? 'shallow' : 'deep',
    sceneType: category === 'character' ? 'portrait' : category === 'location' ? 'environment' : 'detail',
    briefDescription: asset.description || asset.name,
    analysisSource: 'heuristic',
  };
}

function inferEmotionFromKeywords(desc: string, category: string): Emotion {
  const keywords: Record<Emotion, string[]> = {
    calm: ['peaceful', 'serene', 'quiet', 'gentle', 'soft', 'relaxed'],
    curious: ['exploring', 'looking', 'discovering', 'searching', 'wondering'],
    tense: ['dark', 'shadow', 'danger', 'tense', 'suspense', 'threat'],
    intense: ['power', 'fierce', 'dramatic', 'bold', 'strong', 'explosive'],
    triumphant: ['victory', 'triumph', 'celebrate', 'winning', 'proud'],
    reflective: ['thoughtful', 'contemplat', 'ponder', 'memory', 'nostalg'],
    energetic: ['action', 'dynamic', 'fast', 'move', 'run', 'dance', 'vibrant'],
    mysterious: ['mystery', 'enigma', 'hidden', 'secret', 'fog', 'mist'],
  };

  let best: Emotion = 'calm';
  let bestScore = 0;
  for (const [emotion, kws] of Object.entries(keywords) as [Emotion, string[]][]) {
    const score = kws.reduce((s, kw) => s + (desc.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = emotion; }
  }

  if (bestScore === 0) {
    const defaults: Record<string, Emotion> = {
      character: 'calm', location: 'mysterious', wardrobe: 'curious',
      prop: 'curious', vehicle: 'energetic', accessory: 'reflective',
    };
    best = defaults[category] || 'calm';
  }
  return best;
}

function inferLightingFromKeywords(desc: string): string {
  if (/\b(soft|gentle|diffused|warm glow)\b/.test(desc)) return 'soft';
  if (/\b(harsh|hard|direct|bright sun)\b/.test(desc)) return 'hard';
  if (/\b(natural|outdoor|daylight|sun)\b/.test(desc)) return 'natural';
  if (/\b(dramatic|moody|noir|contrast|shadow)\b/.test(desc)) return 'dramatic';
  return 'neutral';
}

// ─── Narrative Plan ──────────────────────────────────────────────

function buildNarrativePlan(pacing: string, assetCount: number): NarrativeSlot[] {
  const slots: NarrativeSlot[] = [];
  for (let i = 0; i < assetCount; i++) {
    const progress = i / (assetCount - 1 || 1);
    const act: 1 | 2 | 3 = progress < 0.25 ? 1 : progress < 0.75 ? 2 : 3;

    let type: NarrativeSlot['type'];
    if (i === 0) type = 'intro';
    else if (i === assetCount - 1) type = 'closing';
    else if (progress < 0.2) type = 'build';
    else if (progress < 0.5) type = 'develop';
    else if (progress < 0.7) type = 'tension';
    else if (progress < 0.85) type = 'climax';
    else type = 'resolve';

    const emotionMap: Record<NarrativeSlot['type'], Emotion> = {
      intro: 'calm', build: 'curious', develop: 'energetic',
      tension: 'tense', climax: 'intense', resolve: 'reflective', closing: 'calm',
    };

    let camera: CameraSize;
    if (type === 'intro' || type === 'closing') camera = 'wide';
    else if (type === 'build' || type === 'develop') camera = 'medium';
    else if (type === 'climax' || type === 'tension') camera = 'close';
    else camera = 'medium';

    const suffixMap: Record<NarrativeSlot['type'], string> = {
      intro: 'opening reveal, establishing the world',
      build: 'building context, introducing elements',
      develop: 'action and energy, narrative development',
      tension: 'rising stakes, mounting tension',
      climax: 'peak dramatic moment, highest intensity',
      resolve: 'resolution, emotional release',
      closing: 'final contemplative moment, pulling back',
    };

    slots.push({
      scene: i + 1, type, emotion: emotionMap[type], camera, act,
      promptSuffix: suffixMap[type],
    });
  }
  return slots;
}

// ─── Scoring ─────────────────────────────────────────────────────

function isEmotionAdjacent(a: Emotion, b: Emotion): boolean {
  const adj: Record<Emotion, Emotion[]> = {
    calm: ['curious', 'reflective'],
    curious: ['calm', 'energetic', 'mysterious'],
    tense: ['mysterious', 'intense'],
    intense: ['tense', 'triumphant', 'energetic'],
    triumphant: ['intense', 'energetic', 'reflective'],
    reflective: ['calm', 'triumphant', 'mysterious'],
    energetic: ['curious', 'intense', 'triumphant'],
    mysterious: ['tense', 'curious', 'reflective'],
  };
  return adj[a]?.includes(b) ?? false;
}

function isCameraAdjacent(a: CameraSize, b: CameraSize): boolean {
  const order: CameraSize[] = ['aerial', 'wide', 'medium', 'close', 'extreme-close'];
  return Math.abs(order.indexOf(a) - order.indexOf(b)) <= 1;
}

function scoreLightingMatch(assetLighting: string, styleLighting: string): number {
  const compat: Record<string, string[]> = {
    warm: ['soft', 'natural'], cool: ['hard', 'neutral'],
    'high-contrast': ['hard', 'dramatic'], mood: ['dramatic', 'soft'],
  };
  if (compat[styleLighting]?.includes(assetLighting)) return 1.0;
  if (assetLighting === 'neutral') return 0.7;
  return 0.3;
}

function scoreCandidate(
  profile: AssetProfile,
  slot: NarrativeSlot,
  styleLighting: string,
): ScoredCandidate {
  const emotionMatch = profile.emotion === slot.emotion ? 1.0
    : isEmotionAdjacent(profile.emotion, slot.emotion) ? 0.6 : 0.2;

  const cameraMatch = profile.camera === slot.camera ? 1.0
    : isCameraAdjacent(profile.camera, slot.camera) ? 0.6 : 0.2;

  const lightingMatch = scoreLightingMatch(profile.lighting, styleLighting);

  const score =
    emotionMatch * WEIGHTS.emotionMatch +
    cameraMatch * WEIGHTS.cameraMatch +
    lightingMatch * WEIGHTS.lightingMatch +
    profile.characterConsistency * WEIGHTS.characterConsistency +
    profile.poseRelevance * WEIGHTS.poseRelevance +
    profile.compositionQuality * WEIGHTS.compositionQuality +
    profile.narrativeStrength * WEIGHTS.narrativeStrength;

  return {
    asset: profile.asset,
    profile,
    score,
    breakdown: {
      emotionMatch, cameraMatch, lightingMatch,
      characterConsistency: profile.characterConsistency,
      poseRelevance: profile.poseRelevance,
      compositionQuality: profile.compositionQuality,
      narrativeStrength: profile.narrativeStrength,
    },
  };
}

// ─── Continuity Enforcement ──────────────────────────────────────

function enforceContinuity(
  candidates: ScoredCandidate[],
  prev: SelectedScene | null,
): ScoredCandidate[] {
  if (!prev || !prev.analysis) return candidates;
  const pp = prev.analysis;

  return candidates.map((c) => {
    let bonus = 0;

    // Camera progression smoothness
    if (isCameraAdjacent(pp.camera, c.profile.camera)) bonus += 0.10;
    else bonus -= 0.15;

    // Emotion continuity
    if (isEmotionAdjacent(pp.emotion, c.profile.emotion) || pp.emotion === c.profile.emotion) bonus += 0.08;
    else bonus -= 0.10;

    // Lighting continuity
    if (pp.lighting === c.profile.lighting) bonus += 0.05;

    // Color temperature continuity
    if (pp.colorTemperature === c.profile.colorTemperature) bonus += 0.04;

    // Avoid same category back-to-back (except characters)
    if (pp.asset.category === c.profile.asset.category && pp.asset.category !== 'character') bonus -= 0.08;

    // Character after location = natural film grammar
    if (c.profile.asset.category === 'character' && pp.asset.category === 'location') bonus += 0.06;

    return { ...c, score: Math.max(0, Math.min(1, c.score + bonus)) };
  });
}

// ─── Hard Filter ─────────────────────────────────────────────────

function applyHardFilters(candidates: ScoredCandidate[], slot: NarrativeSlot): ScoredCandidate[] {
  return candidates.filter((c) => {
    if (!c.asset.imageUrl || c.asset.status !== 'succeeded') return false;
    if (c.profile.characterConsistency < MIN_CHARACTER_CONSISTENCY) return false;

    // Reject emotional opposites
    const opposites: Record<Emotion, Emotion[]> = {
      calm: ['intense'], intense: ['calm'], curious: [],
      tense: ['triumphant'], triumphant: ['tense'],
      reflective: ['energetic'], energetic: ['reflective'], mysterious: [],
    };
    if (opposites[slot.emotion]?.includes(c.profile.emotion)) return false;

    return true;
  });
}

// ─── Video Motion Prompt ─────────────────────────────────────────

const SLOT_VIDEO_PROMPTS: Record<NarrativeSlot['type'], string> = {
  intro: 'slow establishing reveal, camera drifting gently, world coming into focus',
  build: 'steady camera movement, building visual interest, subtle push-in',
  develop: 'dynamic camera energy, following action, motivated movement',
  tension: 'tight framing, slow creeping push-in, building suspense',
  climax: 'dramatic camera energy, intense movement, peak visual power',
  resolve: 'breathing room, gentle pull-back, emotional release',
  closing: 'slow wide pull-back, contemplative fade, final moment',
};

// ─── Reason Builder ──────────────────────────────────────────────

function buildReason(c: ScoredCandidate, slot: NarrativeSlot, isSub: boolean): string {
  const parts: string[] = [];
  if (isSub) parts.push('Best available (no perfect match)');

  if (c.profile.analysisSource === 'vision') {
    parts.push(`AI analyzed: ${c.profile.briefDescription}`);
  }

  if (c.breakdown.emotionMatch >= 0.8) parts.push(`${slot.emotion} emotion match`);
  else if (c.breakdown.emotionMatch >= 0.5) parts.push(`${c.profile.emotion} → ${slot.emotion}`);

  if (c.breakdown.cameraMatch >= 0.8) parts.push(`${slot.camera} shot`);
  else if (c.breakdown.cameraMatch >= 0.5) parts.push(`smooth transition to ${slot.camera}`);

  if (c.breakdown.compositionQuality >= 0.8) parts.push('strong composition');
  if (c.breakdown.narrativeStrength >= 0.8) parts.push('high narrative strength');

  parts.push(`[${c.asset.category}] ${c.asset.name}`);
  return parts.join(' · ');
}

// ─── Rejection Evaluation ────────────────────────────────────────

function evaluateForRejection(
  candidate: ScoredCandidate,
  slot: NarrativeSlot,
  prev: SelectedScene | null,
  next: SelectedScene | null,
  styleLighting: string,
): { accepted: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const p = candidate.profile;
  const b = candidate.breakdown;

  // Character consistency hard gate
  if (p.characterConsistency < REJECTION_THRESHOLDS.characterConsistency) {
    reasons.push(`character consistency too low (${p.characterConsistency.toFixed(2)} < ${REJECTION_THRESHOLDS.characterConsistency})`);
  }

  // Overall score floor
  if (candidate.score < REJECTION_THRESHOLDS.minOverallScore) {
    reasons.push(`overall score too low (${candidate.score.toFixed(2)} < ${REJECTION_THRESHOLDS.minOverallScore})`);
  }

  // Emotion mismatch (not even adjacent)
  if (b.emotionMatch <= REJECTION_THRESHOLDS.emotionMatchFloor) {
    reasons.push(`emotion mismatch (${p.emotion} instead of ${slot.emotion} for ${slot.type} scene)`);
  }

  // Camera mismatch (not adjacent)
  if (b.cameraMatch <= REJECTION_THRESHOLDS.cameraMatchFloor) {
    reasons.push(`camera mismatch (${p.camera} instead of ${slot.camera})`);
  }

  // Composition quality floor
  if (p.compositionQuality < REJECTION_THRESHOLDS.compositionQualityFloor) {
    reasons.push(`poor composition quality (${p.compositionQuality.toFixed(2)})`);
  }

  // Continuity violations with adjacent scenes
  if (prev?.analysis) {
    if (!isCameraAdjacent(prev.analysis.camera, p.camera)) {
      reasons.push(`abrupt camera jump from previous scene (${prev.analysis.camera} → ${p.camera})`);
    }
    if (!isEmotionAdjacent(prev.analysis.emotion, p.emotion) && prev.analysis.emotion !== p.emotion) {
      reasons.push(`jarring emotion shift from previous scene (${prev.analysis.emotion} → ${p.emotion})`);
    }
  }

  if (next?.analysis) {
    if (!isCameraAdjacent(p.camera, next.analysis.camera)) {
      reasons.push(`abrupt camera jump to next scene (${p.camera} → ${next.analysis.camera})`);
    }
  }

  // Lighting inconsistency with style DNA
  const lightScore = scoreLightingMatch(p.lighting, styleLighting);
  if (lightScore <= 0.3) {
    reasons.push(`lighting mismatch with style DNA (${p.lighting} vs ${styleLighting} setting)`);
  }

  return { accepted: reasons.length === 0, reasons };
}

// ─── Reference Image Selection for Regeneration ─────────────────

function selectReferenceImagesForRegeneration(
  slot: NarrativeSlot,
  allSelections: SelectedScene[],
  allProfiles: AssetProfile[],
  currentIndex: number,
  state: WizardState,
  escalated = false,
): { refs: ReferenceImage[]; conditioning: ConditioningInputs } {
  const weights = escalated ? ESCALATED_WEIGHTS : CONDITIONING_WEIGHTS;
  const refs: ReferenceImage[] = [];

  const conditioning: ConditioningInputs = {
    primary_character_reference: null,
    style_dna_reference: null,
    continuity_reference_prev: null,
    continuity_reference_next: null,
  };

  // 1. PRIMARY_CHARACTER_REFERENCE — highest character consistency, defines identity
  const charRefs = allSelections
    .filter((s, i) => i !== currentIndex && s.analysis && s.analysis.characterConsistency > 0.9 && s.selectedAsset.imageUrl)
    .sort((a, b) => (b.analysis?.characterConsistency ?? 0) - (a.analysis?.characterConsistency ?? 0));

  if (charRefs.length > 0) {
    const best = charRefs[0];
    const ref: ReferenceImage = {
      imageId: best.selectedAsset.id,
      asset: best.selectedAsset,
      usage: 'primary_character_reference',
      reason: `best character consistency (${best.analysis!.characterConsistency.toFixed(2)}) — identity anchor for face, body, proportions`,
      score: best.analysis!.characterConsistency,
      weight: weights.primary_character_reference,
    };
    refs.push(ref);
    conditioning.primary_character_reference = {
      imageId: best.selectedAsset.id,
      weight: weights.primary_character_reference,
      imageUrl: best.selectedAsset.imageUrl!,
    };
  }

  // 2. STYLE_DNA_REFERENCE — best match for lighting + color grading from Style DNA
  const styleRefs = allProfiles
    .filter((p) => !refs.some((r) => r.imageId === p.asset.id) && p.asset.imageUrl)
    .filter((p) => {
      const lightOk = scoreLightingMatch(p.lighting, state.lighting) >= 0.7;
      const charOk = p.characterConsistency >= 0.85;
      return lightOk && charOk;
    })
    .sort((a, b) => {
      const aLight = scoreLightingMatch(a.lighting, state.lighting);
      const bLight = scoreLightingMatch(b.lighting, state.lighting);
      return (bLight + b.compositionQuality) - (aLight + a.compositionQuality);
    });

  if (styleRefs.length > 0) {
    const best = styleRefs[0];
    const ref: ReferenceImage = {
      imageId: best.asset.id,
      asset: best.asset,
      usage: 'style_dna_reference',
      reason: `defines lighting (${best.lighting}), color grading, and cinematic tone`,
      score: best.compositionQuality,
      weight: weights.style_dna_reference,
    };
    refs.push(ref);
    conditioning.style_dna_reference = {
      imageId: best.asset.id,
      weight: weights.style_dna_reference,
      imageUrl: best.asset.imageUrl!,
    };
  }

  // 3. CONTINUITY_REFERENCE_PREV — previous scene for smooth transition
  if (currentIndex > 0 && allSelections[currentIndex - 1]) {
    const prev = allSelections[currentIndex - 1];
    if (prev.selectedAsset.imageUrl) {
      const ref: ReferenceImage = {
        imageId: prev.selectedAsset.id,
        asset: prev.selectedAsset,
        usage: 'continuity_reference_prev',
        reason: `ensures smooth transition from ${prev.analysis?.emotion ?? 'unknown'} ${prev.analysis?.camera ?? 'unknown'} scene`,
        score: prev.score,
        weight: weights.continuity_reference_prev,
      };
      refs.push(ref);
      conditioning.continuity_reference_prev = {
        imageId: prev.selectedAsset.id,
        weight: weights.continuity_reference_prev,
        imageUrl: prev.selectedAsset.imageUrl!,
      };
    }
  }

  // 4. CONTINUITY_REFERENCE_NEXT (optional) — next scene for forward alignment
  if (currentIndex < allSelections.length - 1 && allSelections[currentIndex + 1]) {
    const next = allSelections[currentIndex + 1];
    if (next.selectedAsset.imageUrl) {
      const ref: ReferenceImage = {
        imageId: next.selectedAsset.id,
        asset: next.selectedAsset,
        usage: 'continuity_reference_next',
        reason: `aligns progression toward ${next.analysis?.emotion ?? 'unknown'} ${next.analysis?.camera ?? 'unknown'} upcoming scene`,
        score: next.score,
        weight: weights.continuity_reference_next,
      };
      refs.push(ref);
      conditioning.continuity_reference_next = {
        imageId: next.selectedAsset.id,
        weight: weights.continuity_reference_next,
        imageUrl: next.selectedAsset.imageUrl!,
      };
    }
  }

  return { refs, conditioning };
}

// ─── Regeneration Prompt Builder ────────────────────────────────

function buildRegenerationPrompt(
  rejection: { reasons: string[]; refs: ReferenceImage[]; conditioning: ConditioningInputs; escalated?: boolean },
  slot: NarrativeSlot,
  state: WizardState,
): string {
  const parts: string[] = [];
  const c = rejection.conditioning;
  const escalated = rejection.escalated ?? false;

  // Identity anchor — hard constraint
  if (c.primary_character_reference) {
    if (escalated) {
      parts.push(
        `Strictly maintain facial structure and identity using reference image ${c.primary_character_reference.imageId} as the absolute identity anchor (weight ${c.primary_character_reference.weight}). Face and body MUST closely match this reference.`
      );
    } else {
      parts.push(
        `Regenerate the scene ensuring the same character identity as reference image ${c.primary_character_reference.imageId} (weight ${c.primary_character_reference.weight}). Face, body, and proportions must match.`
      );
    }
  } else {
    parts.push(`Regenerate the scene maintaining maximum character consistency and realism.`);
  }

  // Corrections from rejection reasons
  for (const reason of rejection.reasons) {
    if (reason.includes('emotion mismatch')) {
      parts.push(`Adjust emotion to '${slot.emotion}'.`);
    }
    if (reason.includes('camera mismatch')) {
      parts.push(`Use ${slot.camera} camera framing.`);
    }
    if (reason.includes('character consistency')) {
      parts.push(`Prioritize facial structure accuracy and character identity preservation.`);
    }
    if (reason.includes('composition quality')) {
      parts.push(`Improve composition with rule-of-thirds framing and clear visual hierarchy.`);
    }
    if (reason.includes('lighting mismatch')) {
      parts.push(`Match lighting to the ${state.lighting} style DNA setting.`);
    }
    if (reason.includes('abrupt camera jump')) {
      parts.push(`Ensure smooth camera distance transition with adjacent scenes.`);
    }
    if (reason.includes('jarring emotion shift')) {
      parts.push(`Ease the emotional transition to feel natural in the narrative flow.`);
    }
  }

  // Style DNA reference — lighting and color
  if (c.style_dna_reference) {
    parts.push(
      `Match lighting and cinematic tone from reference image ${c.style_dna_reference.imageId} (weight ${c.style_dna_reference.weight}).`
    );
  }

  // Continuity from previous scene
  if (c.continuity_reference_prev) {
    parts.push(
      `Ensure smooth transition from reference image ${c.continuity_reference_prev.imageId} (weight ${c.continuity_reference_prev.weight}). Scene must feel like a natural continuation.`
    );
  }

  // Forward continuity to next scene
  if (c.continuity_reference_next) {
    parts.push(
      `Align progression toward reference image ${c.continuity_reference_next.imageId} (weight ${c.continuity_reference_next.weight}).`
    );
  }

  // Hard constraints
  parts.push(`Avoid abrupt visual changes. Maintain high realism and consistency.`);

  // Film grammar
  parts.push(`Scene role: ${slot.type} (Act ${slot.act}). ${slot.promptSuffix}.`);

  if (escalated) {
    parts.push(`CRITICAL: This is a retry. Reduce creative variation and strictly follow all reference constraints.`);
  }

  return parts.join(' ');
}

// ─── Reuse Optimization ─────────────────────────────────────────

function findReusableAsset(
  slot: NarrativeSlot,
  allProfiles: AssetProfile[],
  usedIds: Set<string>,
  styleLighting: string,
): AssetProfile | null {
  // If an unused asset perfectly fits, prefer reuse over regeneration
  const perfectFit = allProfiles
    .filter((p) => !usedIds.has(p.asset.id))
    .filter((p) => {
      const emotionOk = p.emotion === slot.emotion || isEmotionAdjacent(p.emotion, slot.emotion);
      const cameraOk = p.camera === slot.camera || isCameraAdjacent(p.camera, slot.camera);
      const lightOk = scoreLightingMatch(p.lighting, styleLighting) >= 0.7;
      const charOk = p.characterConsistency >= 0.9;
      const qualOk = p.compositionQuality >= 0.6;
      return emotionOk && cameraOk && lightOk && charOk && qualOk;
    })
    .sort((a, b) => b.compositionQuality + b.characterConsistency - a.compositionQuality - a.characterConsistency);

  return perfectFit.length > 0 ? perfectFit[0] : null;
}

// ─── Main Engine ─────────────────────────────────────────────────

export function selectScenesForNarrative(
  assets: ProductionAsset[],
  state: WizardState,
  analysisMap?: Map<string, SceneAnalysis>,
): SelectedScene[] {
  const succeeded = assets.filter((a) => a.status === 'succeeded' && a.imageUrl);
  if (succeeded.length === 0) return [];

  const plan = buildNarrativePlan(state.pacing, succeeded.length);
  const profiles = succeeded.map((a) => profileAsset(a, analysisMap?.get(a.id)));

  const selections: SelectedScene[] = [];
  const usedIds = new Set<string>();

  for (const slot of plan) {
    let candidates = profiles
      .filter((p) => !usedIds.has(p.asset.id))
      .map((p) => scoreCandidate(p, slot, state.lighting));

    const filtered = applyHardFilters(candidates, slot);
    const isSub = filtered.length === 0;
    candidates = filtered.length > 0 ? filtered : candidates;
    if (candidates.length === 0) continue;

    const prev = selections.length > 0 ? selections[selections.length - 1] : null;
    candidates = enforceContinuity(candidates, prev);
    candidates.sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    // Build video motion prompt
    const slotMotion = SLOT_VIDEO_PROMPTS[slot.type] || '';
    const shotType = slot.camera === 'wide' ? 'establishing'
      : slot.camera === 'close' ? 'closeup'
      : slot.camera === 'extreme-close' ? 'insert'
      : slot.camera === 'aerial' ? 'aerial' : 'medium';

    const { videoMotionPrompt: cinematicMotion } = buildCinematicPrompt({
      basePrompt: winner.profile.briefDescription || winner.asset.name,
      sceneType: shotType,
      state,
      continuity: { sceneIndex: slot.scene - 1, totalScenes: plan.length },
    });

    selections.push({
      scene: slot.scene,
      selectedAsset: winner.asset,
      reason: buildReason(winner, slot, isSub),
      score: winner.score,
      videoMotionPrompt: `${slotMotion}, ${cinematicMotion}`,
      analysis: winner.profile,
    });

    usedIds.add(winner.asset.id);
  }

  return selections;
}

// ─── Rejection Evaluation + Resolution ──────────────────────────

/**
 * Evaluate all selected scenes for quality and continuity.
 * Returns selections with rejection data attached where scenes fail thresholds.
 * Every rejected scene includes: reasons, reference images, regeneration prompt.
 */
export function evaluateAndResolveRejections(
  selections: SelectedScene[],
  allAssets: ProductionAsset[],
  state: WizardState,
  analysisMap?: Map<string, SceneAnalysis>,
): SelectedScene[] {
  if (selections.length === 0) return [];

  const profiles = allAssets
    .filter((a) => a.status === 'succeeded' && a.imageUrl)
    .map((a) => profileAsset(a, analysisMap?.get(a.id)));

  const plan = buildNarrativePlan(state.pacing, selections.length);
  if (plan.length === 0) return selections;

  const usedIds = new Set(selections.map((s) => s.selectedAsset.id));

  return selections.map((sel, i) => {
    if (!sel.analysis) return sel;

    const slot = plan[i] ?? plan[plan.length - 1];
    const prev = i > 0 ? selections[i - 1] : null;
    const next = i < selections.length - 1 ? selections[i + 1] : null;

    // Build a ScoredCandidate from the existing selection for evaluation
    const candidate: ScoredCandidate = {
      asset: sel.selectedAsset,
      profile: sel.analysis,
      score: sel.score,
      breakdown: {
        emotionMatch: sel.analysis.emotion === slot.emotion ? 1.0
          : isEmotionAdjacent(sel.analysis.emotion, slot.emotion) ? 0.6 : 0.2,
        cameraMatch: sel.analysis.camera === slot.camera ? 1.0
          : isCameraAdjacent(sel.analysis.camera, slot.camera) ? 0.6 : 0.2,
        lightingMatch: scoreLightingMatch(sel.analysis.lighting, state.lighting),
        characterConsistency: sel.analysis.characterConsistency,
        poseRelevance: sel.analysis.poseRelevance,
        compositionQuality: sel.analysis.compositionQuality,
        narrativeStrength: sel.analysis.narrativeStrength,
      },
    };

    const { accepted, reasons } = evaluateForRejection(candidate, slot, prev, next, state.lighting);

    if (accepted) return sel;

    // --- REJECTED --- Check for reusable asset first
    const reusable = findReusableAsset(slot, profiles, usedIds, state.lighting);
    if (reusable) {
      // Swap in the better asset instead of flagging for regeneration
      const slotMotion = SLOT_VIDEO_PROMPTS[slot.type] || '';
      const shotType = slot.camera === 'wide' ? 'establishing'
        : slot.camera === 'close' ? 'closeup'
        : slot.camera === 'extreme-close' ? 'insert'
        : slot.camera === 'aerial' ? 'aerial' : 'medium';

      const { videoMotionPrompt: cinematicMotion } = buildCinematicPrompt({
        basePrompt: reusable.briefDescription || reusable.asset.name,
        sceneType: shotType,
        state,
        continuity: { sceneIndex: i, totalScenes: selections.length },
      });

      usedIds.delete(sel.selectedAsset.id);
      usedIds.add(reusable.asset.id);

      return {
        ...sel,
        selectedAsset: reusable.asset,
        analysis: reusable,
        score: reusable.compositionQuality * 0.5 + reusable.characterConsistency * 0.5,
        reason: `Swapped: ${reasons[0]} → replaced with better-fitting asset [${reusable.asset.category}] ${reusable.asset.name}`,
        videoMotionPrompt: `${slotMotion}, ${cinematicMotion}`,
        rejection: undefined,
      };
    }

    // No reusable asset — build rejection with conditioning references + regeneration prompt
    const existingRetryCount = sel.rejection?.retryCount ?? 0;
    const escalated = existingRetryCount > 0;
    const { refs, conditioning } = selectReferenceImagesForRegeneration(
      slot, selections, profiles, i, state, escalated,
    );
    const regenPrompt = buildRegenerationPrompt(
      { reasons, refs, conditioning, escalated },
      slot,
      state,
    );

    const rejection: RejectionResult = {
      imageId: sel.selectedAsset.id,
      status: 'rejected',
      reasons,
      referenceImages: refs,
      conditioningInputs: conditioning,
      regenerationPrompt: regenPrompt,
      slot,
      originalScore: sel.score,
      retryCount: existingRetryCount + 1,
    };

    return { ...sel, rejection };
  });
}

/**
 * Get only the rejected scenes that need regeneration.
 */
export function getRejectedScenes(selections: SelectedScene[]): SelectedScene[] {
  return selections.filter((s) => s.rejection != null);
}

/**
 * Build the full regeneration payload for a rejected scene.
 * Includes both the reference images AND the weighted conditioning inputs.
 */
export function buildRejectionPayload(sel: SelectedScene): object | null {
  if (!sel.rejection) return null;
  const r = sel.rejection;

  const condInputs: Record<string, { image_id: string; weight: number; image_url: string | null }> = {};
  for (const [role, val] of Object.entries(r.conditioningInputs)) {
    if (val) {
      condInputs[role] = { image_id: val.imageId, weight: val.weight, image_url: val.imageUrl };
    }
  }

  return {
    image_id: r.imageId,
    status: 'rejected',
    reasons: r.reasons,
    conditioning_inputs: condInputs,
    reference_images: r.referenceImages.map((ref) => ({
      image_id: ref.imageId,
      image_url: ref.asset.imageUrl,
      usage: ref.usage,
      weight: ref.weight,
      reason: ref.reason,
    })),
    regeneration_prompt: r.regenerationPrompt,
    retry_count: r.retryCount,
  };
}

/**
 * Get the conditioning image URLs for a rejection, ready for the generation API.
 * Returns a flat array of { url, weight, role } for the image generation call.
 */
export function getConditioningImages(rejection: RejectionResult): {
  url: string; weight: number; role: ConditioningRole;
}[] {
  const result: { url: string; weight: number; role: ConditioningRole }[] = [];
  for (const [role, val] of Object.entries(rejection.conditioningInputs) as [ConditioningRole, ConditioningInputs[ConditioningRole]][]) {
    if (val && val.imageUrl) {
      result.push({ url: val.imageUrl, weight: val.weight, role });
    }
  }
  return result;
}

/**
 * Convert engine selections into SceneImage objects for video generation.
 */
export function selectionsToScenes(selections: SelectedScene[]): SceneImage[] {
  return selections.map((sel, i) => ({
    id: assetSceneId(sel.selectedAsset.id),
    prompt: sel.selectedAsset.description || sel.selectedAsset.name,
    imageUrl: sel.selectedAsset.imageUrl,
    status: 'completed' as const,
    predictionId: sel.selectedAsset.predictionId,
    error: null,
    videoMotionPrompt: sel.videoMotionPrompt,
    sceneIndex: i,
    imageModelId: sel.selectedAsset.model,
    sourceAssetId: sel.selectedAsset.id,
    assetCategory: sel.selectedAsset.category,
  }));
}
