// ─── Node Execute Functions ─────────────────────────────────────────
//
// Each function wraps an existing API route or library function.
// These run client-side and call the server via fetch.

import type { ExecutionContext } from './types';
import { buildReferenceImageSet, type ReferenceImageSet } from '@/lib/subjectRefs';
import { buildCinematicPrompt, buildVideoStyleSuffix } from '@/lib/cinematicPrompt';
import { checkVisualDrift } from '@/lib/driftDetection';
import type { WizardState } from '@/context/WizardContext';

// ─── Helpers ────────────────────────────────────────────────────────

const POLL_INTERVAL = 2000;
const MAX_POLLS = 240; // 8 minutes

async function pollPrediction(
  predictionId: string,
  signal: AbortSignal,
  onProgress?: (msg: string) => void,
): Promise<{ output: unknown; status: string }> {
  for (let i = 0; i < MAX_POLLS; i++) {
    if (signal.aborted) throw new Error('Aborted');

    const res = await fetch(`/api/status/${predictionId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);

    const data = await res.json();

    if (data.status === 'succeeded') {
      return { output: data.output, status: 'succeeded' };
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(data.error ?? `Prediction ${data.status}`);
    }

    onProgress?.(`Processing... (${Math.round((i / MAX_POLLS) * 100)}%)`);
    await abortableSleep(POLL_INTERVAL, signal);
  }

  throw new Error('Prediction timed out after 8 minutes');
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Aborted')); return; }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    }, { once: true });
  });
}

// ─── ReferenceImages ────────────────────────────────────────────────

export async function executeReferenceImages(
  _inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const state = ctx.wizardState as unknown as WizardState;
  const refSet = buildReferenceImageSet({
    productionAssets: state.productionAssets,
    aiCharacterImageUrl: state.aiCharacterImageUrl,
    styleLockImages: state.styleLockImages,
  });

  return {
    refset: refSet,
    count: refSet.referenceImages.length,
  };
}

// ─── ScenePrompt ────────────────────────────────────────────────────

export async function executeScenePrompt(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const state = ctx.wizardState as unknown as WizardState;
  // Fall back to vision text from wizard state if no base_text connected
  const baseText = (inputs.base_text as string) || state.visionText || '';

  let prompt = baseText;

  if (config.appendStyle !== false) {
    const cinematic = buildCinematicPrompt({ basePrompt: baseText, sceneType: 'general', state });
    const styleSuffix = buildVideoStyleSuffix(state);
    prompt = `${cinematic.imagePrompt} ${styleSuffix}`.trim();
  }

  return { prompt };
}

// ─── ImageGen ───────────────────────────────────────────────────────

export async function executeImageGen(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const prompt = inputs.prompt as string;
  const refSet = inputs.refset as ReferenceImageSet | undefined;

  const body: Record<string, unknown> = {
    prompt,
    imageModelId: config.model ?? 'flux-dev-lora',
    aspectRatio: config.aspectRatio ?? '16:9',
  };

  if (config.seed && (config.seed as number) >= 0) {
    body.seed = config.seed;
  }

  if (refSet?.referenceImages?.length) {
    body.referenceImages = refSet.referenceImages;
  }

  const state = ctx.wizardState as Record<string, unknown>;
  if (state.loraUrl) body.loraUrl = state.loraUrl;
  if (state.triggerWord) body.triggerWord = state.triggerWord;

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error ?? `Image gen failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

  return { image: imageUrl, prediction_id: predictionId };
}

// ─── VideoGen ───────────────────────────────────────────────────────

export async function executeVideoGen(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const prompt = (inputs.prompt as string) ?? '';
  const refSet = inputs.refset as ReferenceImageSet | undefined;

  const body: Record<string, unknown> = {
    imageUrl,
    prompt,
    videoModelId: config.model ?? 'kling-3.0',
    duration: config.duration ?? 5,
    generateAudio: config.generateAudio ?? false,
    aspectRatio: '16:9',
  };

  if (refSet?.referenceImages?.length) {
    body.referenceImages = refSet.referenceImages;
  }

  const res = await fetch('/api/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Video generation failed' }));
    throw new Error(err.error ?? `Video gen failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;

  return { video: videoUrl, prediction_id: predictionId };
}

// ─── MultiPromptBatch ───────────────────────────────────────────────

export async function executeMultiPromptBatch(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const scenes = inputs.scenes as { prompt?: string; videoPrompt?: string; durationHint?: number }[];
  const refSet = inputs.refset as ReferenceImageSet | undefined;
  const startImage = inputs.start_image as string | undefined;

  if (!scenes?.length) throw new Error('No scenes provided');

  const segments = scenes.map((s) => ({
    prompt: s.videoPrompt ?? s.prompt ?? '',
    duration: Math.max(3, s.durationHint ?? 3),
  }));

  const body: Record<string, unknown> = {
    segments,
    aspectRatio: config.aspectRatio ?? '16:9',
    generateAudio: config.generateAudio ?? true,
  };

  if (refSet?.referenceImages?.length) {
    body.referenceImages = refSet.referenceImages;
  }
  if (startImage) {
    body.startImageUrl = startImage;
  }

  const res = await fetch('/api/video-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Batch generation failed' }));
    throw new Error(err.error ?? `Batch gen failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;

  // Multi-prompt returns a single video — duplicate the URL for each scene
  const videos = scenes.map(() => videoUrl);

  return { videos, prediction_id: predictionId };
}

// ─── AudioGen ───────────────────────────────────────────────────────

export async function executeAudioGen(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const script = inputs.script as string;

  const res = await fetch('/api/voiceover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, voice: config.voice ?? 'alloy' }),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Audio generation failed' }));
    throw new Error(err.error ?? `Audio gen failed: ${res.status}`);
  }

  const { audioUrl } = await res.json();
  return { audio: audioUrl };
}

// ─── FaceGate ───────────────────────────────────────────────────────

export async function executeFaceGate(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const threshold = (config.threshold as number) ?? 0.90;

  // Call scene analysis API to get character consistency score
  const res = await fetch('/api/analyze-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`[FaceGate] Scene analysis failed: ${errBody.error || res.statusText}`);
  }

  const analysis = await res.json();
  const score = analysis.character_consistency ?? 0;
  const pass = score >= threshold;

  return { image: imageUrl, pass, score };
}

// ─── StyleGate ──────────────────────────────────────────────────────

export async function executeStyleGate(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const compositionFloor = (config.compositionFloor as number) ?? 0.40;

  const res = await fetch('/api/analyze-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`[StyleGate] Scene analysis failed: ${errBody.error || res.statusText}`);
  }

  const analysis = await res.json();
  const compositionScore = analysis.composition_quality ?? 0;
  const pass = compositionScore >= compositionFloor;

  return {
    image: imageUrl,
    pass,
    score: compositionScore,
  };
}

// ─── DriftGate ──────────────────────────────────────────────────────

export async function executeDriftGate(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  _ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const prevText = inputs.prev_text as string;
  const currText = inputs.curr_text as string;
  const threshold = (config.threshold as number) ?? 0.55;

  const result = await checkVisualDrift(prevText, currText);
  const pass = result.similarity >= threshold;

  return { pass, similarity: result.similarity };
}

// ─── FrameExtract ───────────────────────────────────────────────────

export async function executeFrameExtract(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const videoUrl = inputs.video as string;
  const position = (config.position as string) ?? 'last';

  const res = await fetch('/api/extract-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, position }),
    signal: ctx.signal,
  });

  if (!res.ok) {
    throw new Error('Frame extraction failed');
  }

  const { frameUrl, duration } = await res.json();
  return { frame: frameUrl, duration };
}

// ─── PromptEnrich ───────────────────────────────────────────────────

export async function executePromptEnrich(
  inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const state = ctx.wizardState as Record<string, unknown>;
  // Fall back to wizard state scenes when not connected
  const inputScenes = inputs.scenes as Record<string, unknown>[] | undefined;
  const scenes = inputScenes?.length
    ? inputScenes
    : ((state.scenes as Record<string, unknown>[]) ?? []).filter(
        (s) => s.status === 'completed' && s.imageUrl,
      );
  if (!scenes.length) return { scenes: [] };

  const scenesPayload = scenes.map((s, idx) => ({
    id: s.id ?? `scene-${idx}`,
    prompt: s.prompt,
    imageUrl: s.imageUrl,
    assetCategory: s.assetCategory,
    sceneIndex: idx,
    videoMotionPrompt: s.videoMotionPrompt,
  }));

  const contextPayload = {
    visionText: state.visionText,
    selectedPersona: state.selectedPersona,
    customPersonaTone: state.customPersonaTone,
    customPersonaAtmosphere: state.customPersonaAtmosphere,
    colorIndex: state.colorIndex,
    aspectRatio: state.aspectRatio,
    pacing: state.pacing,
    lighting: state.lighting,
    cameraMotion: state.cameraMotion,
    selectedVideoModel: state.selectedVideoModel,
    includeAudio: state.includeAudio,
    characterName: state.characterName,
    characterGender: state.characterGender,
    aiDescription: state.aiDescription,
    triggerWord: state.triggerWord,
    loraUrl: state.loraUrl,
    styleSuffix: state.styleSuffix,
  };

  const res = await fetch('/api/direct-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes: scenesPayload, context: contextPayload }),
    signal: ctx.signal,
  });

  if (!res.ok) {
    throw new Error('Director AI enrichment failed');
  }

  const { prompts } = await res.json();

  // Merge video prompts back into scenes
  const promptMap = new Map(
    (prompts as { sceneId: string; videoPrompt: string }[]).map((p) => [p.sceneId, p.videoPrompt]),
  );

  const enriched = scenes.map((s) => ({
    ...s,
    videoPrompt: promptMap.get(s.id as string) ?? s.videoPrompt ?? s.prompt,
  }));

  return { scenes: enriched };
}

// ─── Stitch ─────────────────────────────────────────────────────────

export async function executeStitch(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const videos = inputs.videos as string[];
  const audio = inputs.audio as string | undefined;

  if (!videos?.length) throw new Error('No videos to stitch');

  const body: Record<string, unknown> = {
    videoUrls: videos,
    watermark: config.watermark ?? true,
    autoContinuity: config.autoContinuity ?? true,
  };

  // Map audio input to the correct API field
  if (audio) {
    body.voiceoverUrl = audio;
  }

  // Build transitions array from config
  const transitionType = (config.transition as string) ?? 'cut';
  if (transitionType !== 'cut' && videos.length > 1) {
    body.transitions = Array.from({ length: videos.length - 1 }, () => ({
      type: transitionType,
      duration: 0.5,
    }));
  }

  const res = await fetch('/api/stitch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Video stitching failed' }));
    throw new Error(err.error ?? `Stitch failed: ${res.status}`);
  }

  // The stitch API returns a binary video stream, not JSON.
  // Convert to a blob URL for downstream consumption.
  const blob = await res.blob();
  const videoUrl = URL.createObjectURL(blob);
  return { video: videoUrl };
}

// ─── Export ─────────────────────────────────────────────────────────

export async function executeExport(
  inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const videoUrl = inputs.video as string;

  // Write the final video URL to wizard state
  ctx.updateWizardState({ finalVideoUrl: videoUrl });

  return {};
}
