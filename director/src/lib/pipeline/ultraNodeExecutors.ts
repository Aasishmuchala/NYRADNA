// ─── Ultra Mode Node Execute Functions ──────────────────────────────
//
// Executors for the 9 Ultra pipeline nodes. Each wraps an API route
// following the same poll-until-done pattern as the standard executors.

import type { ExecutionContext } from './types';

// ─── Helpers (shared with nodeExecutors.ts) ────────────────────────

const INITIAL_POLL_INTERVAL = 2000;
const MAX_POLL_INTERVAL = 10000;
const MAX_POLL_DURATION_MS = 480_000; // 8 minutes
const FETCH_TIMEOUT_MS = 30_000; // 30s per-request timeout

/** Fetch with a timeout that rejects if the server hangs */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const timeout = init?.timeout ?? FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const merged = init?.signal
    ? mergeAbortSignals(init.signal, controller.signal)
    : controller.signal;

  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: merged });
  } finally {
    clearTimeout(timer);
  }
}

/** Combine two abort signals -- aborts when either fires */
function mergeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

async function pollPrediction(
  predictionId: string,
  signal: AbortSignal,
  onProgress?: (msg: string) => void,
): Promise<{ output: unknown; status: string }> {
  const startTime = Date.now();
  let pollInterval = INITIAL_POLL_INTERVAL;

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    if (signal.aborted) throw new Error('Aborted');

    const res = await fetchWithTimeout(`/api/status/${predictionId}`, { signal });
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);

    const data = await res.json();

    if (data.status === 'succeeded') {
      return { output: data.output, status: 'succeeded' };
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(data.error ?? `Prediction ${data.status}`);
    }

    const elapsed = Date.now() - startTime;
    onProgress?.(`Processing... (${Math.round((elapsed / MAX_POLL_DURATION_MS) * 100)}%)`);
    await abortableSleep(pollInterval, signal);
    pollInterval = Math.min(pollInterval + 1000, MAX_POLL_INTERVAL);
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

// ─── ControlEstimator ──────────────────────────────────────────────

/**
 * AI-estimates depth + pose control maps from a reference image.
 * Calls /api/estimate-depth and /api/estimate-pose in parallel.
 */
export async function executeControlEstimator(
  inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  if (!imageUrl) throw new Error('[ControlEstimator] No input image provided');

  ctx.onProgress('', 'Estimating depth and pose maps...');

  // Fire both estimation requests in parallel
  const [depthRes, poseRes] = await Promise.all([
    fetchWithTimeout('/api/estimate-depth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
      signal: ctx.signal,
    }),
    fetchWithTimeout('/api/estimate-pose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
      signal: ctx.signal,
    }),
  ]);

  if (!depthRes.ok) {
    const err = await depthRes.json().catch(() => ({ error: 'Depth estimation failed' }));
    throw new Error(err.error ?? `Depth estimation failed: ${depthRes.status}`);
  }
  if (!poseRes.ok) {
    const err = await poseRes.json().catch(() => ({ error: 'Pose estimation failed' }));
    throw new Error(err.error ?? `Pose estimation failed: ${poseRes.status}`);
  }

  const depthData = await depthRes.json();
  const poseData = await poseRes.json();

  // Poll both predictions in parallel
  const [depthResult, poseResult] = await Promise.all([
    pollPrediction(depthData.predictionId, ctx.signal, (msg) => {
      ctx.onProgress('', `Depth: ${msg}`);
    }),
    pollPrediction(poseData.predictionId, ctx.signal, (msg) => {
      ctx.onProgress('', `Pose: ${msg}`);
    }),
  ]);

  const depthMap = typeof depthResult.output === 'string'
    ? depthResult.output
    : Array.isArray(depthResult.output) ? depthResult.output[0] : String(depthResult.output ?? '');

  const poseMap = typeof poseResult.output === 'string'
    ? poseResult.output
    : Array.isArray(poseResult.output) ? poseResult.output[0] : String(poseResult.output ?? '');

  return {
    control_map: { depth: depthMap, pose: poseMap, source: imageUrl },
    depth_map: depthMap,
    pose_map: poseMap,
  };
}

// ─── ControlNetGen ─────────────────────────────────────────────────

/**
 * Generates an image conditioned on control signals (depth, pose, canny).
 * Calls /api/controlnet-gen with the control map and prompt.
 */
export async function executeControlNetGen(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const prompt = inputs.prompt as string;
  const controlMap = inputs.control_map as { depth?: string; pose?: string; source?: string } | undefined;

  if (!prompt) throw new Error('[ControlNetGen] No prompt provided');

  ctx.onProgress('', 'Generating controlled image...');

  const body: Record<string, unknown> = {
    prompt,
    model: config.model ?? 'flux-controlnet',
    controlType: config.controlType ?? 'depth',
    strength: config.strength ?? 0.85,
    aspectRatio: config.aspectRatio ?? '16:9',
  };

  if (controlMap) {
    body.controlImageUrl = controlMap.depth ?? controlMap.pose ?? controlMap.source;
    body.controlMap = controlMap;
  }

  const res = await fetchWithTimeout('/api/controlnet-gen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'ControlNet generation failed' }));
    throw new Error(err.error ?? `ControlNet gen failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const rawOutput = Array.isArray(result.output) ? result.output[0] : result.output;
  const imageUrl = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

  return { image: imageUrl, prediction_id: predictionId };
}

// ─── VACEVideoGen ──────────────────────────────────────────────────

/**
 * WAN VACE structure-aware video generation.
 * Calls /api/vace-video with control signals and prompt.
 */
export async function executeVACEVideoGen(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const prompt = (inputs.prompt as string) ?? '';
  const controlMap = inputs.control_map as { depth?: string; pose?: string } | undefined;

  if (!imageUrl) throw new Error('[VACEVideoGen] No start image provided');

  ctx.onProgress('', 'Generating VACE structure-aware video...');

  const body: Record<string, unknown> = {
    imageUrl,
    prompt,
    model: config.model ?? 'vace-14b',
    duration: config.duration ?? 5,
    aspectRatio: config.aspectRatio ?? '16:9',
    structureStrength: config.structureStrength ?? 0.8,
  };

  if (controlMap) {
    body.controlMap = controlMap;
  }

  const res = await fetchWithTimeout('/api/vace-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'VACE video generation failed' }));
    throw new Error(err.error ?? `VACE video gen failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const rawOutput = Array.isArray(result.output) ? result.output[0] : result.output;
  const videoUrl = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

  return { video: videoUrl, prediction_id: predictionId };
}

// ─── IPAdapterLock ─────────────────────────────────────────────────

/**
 * Style lock from hero frame using IP-Adapter.
 * Calls /api/identity-lock with ip-adapter model.
 */
export async function executeIPAdapterLock(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const prompt = (inputs.prompt as string) ?? '';

  if (!imageUrl) throw new Error('[IPAdapterLock] No hero image provided');

  ctx.onProgress('', 'Locking style with IP-Adapter...');

  const body: Record<string, unknown> = {
    faceImage: imageUrl,
    prompt,
    model: 'ip-adapter-faceid',
    idWeight: config.strength ?? 0.8,
  };

  const res = await fetchWithTimeout('/api/identity-lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'IP-Adapter lock failed' }));
    throw new Error(err.error ?? `IP-Adapter lock failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const rawOutput = Array.isArray(result.output) ? result.output[0] : result.output;
  const lockedImageUrl = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

  return { image: lockedImageUrl, prediction_id: predictionId };
}

// ─── SceneComposer3D ───────────────────────────────────────────────

/**
 * Placeholder for Phase 3 Three.js-based 3D scene composer.
 * Returns null with a warning — not yet implemented.
 */
export async function executeSceneComposer3D(
  _inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  ctx.onProgress('', 'SceneComposer3D is a Phase 3 feature (not yet available)');

  return {
    control_map: null,
    warning: 'SceneComposer3D is a placeholder for Phase 3. Use ControlEstimator (AI estimate) or upload control maps instead.',
  };
}

// ─── ControlPreview ────────────────────────────────────────────────

/**
 * Client-side side-by-side overlay preview of control maps.
 * Returns the input image as-is for now (visualization handled by UI).
 */
export async function executeControlPreview(
  inputs: Record<string, unknown>,
  _config: Record<string, unknown>,
  _ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const controlMap = inputs.control_map as { depth?: string; pose?: string; source?: string } | undefined;

  return {
    preview: imageUrl ?? controlMap?.source ?? null,
    control_map: controlMap ?? null,
  };
}

// ─── IdentityLock ──────────────────────────────────────────────────

/**
 * PuLID face identity preservation.
 * Calls /api/identity-lock with pulid-flux model.
 */
export async function executeIdentityLock(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const prompt = (inputs.prompt as string) ?? '';

  if (!imageUrl) throw new Error('[IdentityLock] No face image provided');

  ctx.onProgress('', 'Locking face identity with PuLID...');

  const body: Record<string, unknown> = {
    faceImage: imageUrl,
    prompt,
    model: (config.model as string) ?? 'pulid-flux',
    idWeight: config.idWeight ?? 0.85,
  };

  const res = await fetchWithTimeout('/api/identity-lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'PuLID identity lock failed' }));
    throw new Error(err.error ?? `PuLID identity lock failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const rawOutput = Array.isArray(result.output) ? result.output[0] : result.output;
  const lockedImageUrl = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

  return { image: lockedImageUrl, prediction_id: predictionId };
}

// ─── QualityGate ───────────────────────────────────────────────────

/**
 * CLIP + ArcFace + DreamSim quality scoring.
 * Calls /api/quality-score to evaluate an image against references.
 */
export async function executeQualityGate(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const referenceUrl = inputs.reference as string | undefined;

  if (!imageUrl) throw new Error('[QualityGate] No image provided');

  ctx.onProgress('', 'Scoring quality (CLIP + ArcFace + DreamSim)...');

  const body: Record<string, unknown> = {
    image1: referenceUrl ?? imageUrl,
    image2: imageUrl,
    metrics: ['clip', 'dreamsim', 'arcface'],
  };

  const res = await fetchWithTimeout('/api/quality-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Quality scoring failed' }));
    throw new Error(err.error ?? `Quality scoring failed: ${res.status}`);
  }

  const data = await res.json();
  const scores = {
    clip: data.clip ?? 0,
    arcface: data.arcface ?? 0,
    dreamsim: data.dreamsim ?? 0,
    overall: data.overall ?? 0,
  };

  const clipPass = scores.clip >= ((config.clipThreshold as number) ?? 0.75);
  const arcfacePass = scores.arcface >= ((config.arcfaceThreshold as number) ?? 0.85);
  const dreamsimPass = scores.dreamsim >= ((config.dreamsimThreshold as number) ?? 0.70);
  const pass = clipPass && arcfacePass && dreamsimPass;

  return {
    image: imageUrl,
    pass,
    scores,
    overall: scores.overall,
  };
}

// ─── ProgressiveRefine ─────────────────────────────────────────────

/**
 * 4-stage quality ladder: draft -> refined -> polished -> final.
 * Calls /api/progressive-refine which iterates through quality stages.
 */
export async function executeProgressiveRefine(
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const imageUrl = inputs.image as string;
  const prompt = (inputs.prompt as string) ?? '';

  if (!imageUrl) throw new Error('[ProgressiveRefine] No image provided');

  const stages = ['draft', 'refined', 'polished', 'final'];
  const targetStage = (config.targetStage as string) ?? 'final';
  const stageIndex = stages.indexOf(targetStage);
  const stageCount = stageIndex >= 0 ? stageIndex + 1 : 4;

  ctx.onProgress('', `Starting progressive refinement (${stageCount} stages)...`);

  const body: Record<string, unknown> = {
    baseImage: imageUrl,
    controlImage: (inputs.control_image as string) ?? imageUrl,
    prompt,
    heroImage: (inputs.hero_image as string) ?? undefined,
    stages: stageCount,
  };

  const res = await fetchWithTimeout('/api/progressive-refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Progressive refinement failed' }));
    throw new Error(err.error ?? `Progressive refinement failed: ${res.status}`);
  }

  const { predictionId } = await res.json();

  const result = await pollPrediction(predictionId, ctx.signal, (msg) => {
    ctx.onProgress('', msg);
  });

  const rawOutput = Array.isArray(result.output) ? result.output[0] : result.output;
  const refinedImageUrl = typeof rawOutput === 'string' ? rawOutput : String(rawOutput ?? '');

  return {
    image: refinedImageUrl,
    prediction_id: predictionId,
    stage: targetStage,
  };
}
