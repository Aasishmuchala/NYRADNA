// ─── Default Pipeline Presets ────────────────────────────────────────
//
// Pre-built pipeline graphs that ship with the app.

import type { PipelineGraph } from './graph';

/**
 * Default "Director Pipeline" — matches the standard generation flow:
 * References → Image Gen → Face Gate → Video Gen → Frame Extract → Stitch → Export
 */
export const DIRECTOR_PIPELINE: PipelineGraph = {
  id: 'preset-director',
  name: 'Director Pipeline',
  description: 'Standard generation with face consistency gate. Catches bad images before video gen.',
  nodes: [
    // Source
    {
      id: 'n-refs',
      type: 'ReferenceImages',
      position: { x: 50, y: 150 },
      config: {},
    },
    {
      id: 'n-prompt',
      type: 'ScenePrompt',
      position: { x: 50, y: 320 },
      config: { appendStyle: true },
    },
    // Generation
    {
      id: 'n-imagegen',
      type: 'ImageGen',
      position: { x: 320, y: 200 },
      config: { model: 'flux-dev-lora', aspectRatio: '16:9', seed: -1 },
    },
    // Quality gate
    {
      id: 'n-facegate',
      type: 'FaceGate',
      position: { x: 580, y: 200 },
      config: { threshold: 0.90, retryOnFail: true, maxRetries: 3 },
    },
    // Video generation
    {
      id: 'n-videogen',
      type: 'VideoGen',
      position: { x: 840, y: 200 },
      config: { model: 'kling-3.0', duration: 5, generateAudio: false },
    },
    // Frame extract for continuity
    {
      id: 'n-frameextract',
      type: 'FrameExtract',
      position: { x: 1100, y: 200 },
      config: { position: 'last' },
    },
    // Stitch
    {
      id: 'n-stitch',
      type: 'Stitch',
      position: { x: 1100, y: 380 },
      config: { transition: 'cut' },
    },
    // Export
    {
      id: 'n-export',
      type: 'Export',
      position: { x: 1360, y: 380 },
      config: { format: 'mp4' },
    },
  ],
  edges: [
    // Refs → ImageGen
    { id: 'e-1', sourceNodeId: 'n-refs', sourcePortId: 'refset', targetNodeId: 'n-imagegen', targetPortId: 'refset' },
    // Prompt → ImageGen
    { id: 'e-2', sourceNodeId: 'n-prompt', sourcePortId: 'prompt', targetNodeId: 'n-imagegen', targetPortId: 'prompt' },
    // ImageGen → FaceGate
    { id: 'e-3', sourceNodeId: 'n-imagegen', sourcePortId: 'image', targetNodeId: 'n-facegate', targetPortId: 'image' },
    // Refs → FaceGate
    { id: 'e-4', sourceNodeId: 'n-refs', sourcePortId: 'refset', targetNodeId: 'n-facegate', targetPortId: 'refset' },
    // FaceGate → VideoGen
    { id: 'e-5', sourceNodeId: 'n-facegate', sourcePortId: 'image', targetNodeId: 'n-videogen', targetPortId: 'image' },
    // Refs → VideoGen
    { id: 'e-6', sourceNodeId: 'n-refs', sourcePortId: 'refset', targetNodeId: 'n-videogen', targetPortId: 'refset' },
    // VideoGen → FrameExtract
    { id: 'e-7', sourceNodeId: 'n-videogen', sourcePortId: 'video', targetNodeId: 'n-frameextract', targetPortId: 'video' },
    // VideoGen → Stitch
    { id: 'e-8', sourceNodeId: 'n-videogen', sourcePortId: 'video', targetNodeId: 'n-stitch', targetPortId: 'videos' },
    // Stitch → Export
    { id: 'e-9', sourceNodeId: 'n-stitch', sourcePortId: 'video', targetNodeId: 'n-export', targetPortId: 'video' },
  ],
};

/**
 * Kling Multi-Prompt pipeline — uses batch generation for multi-shot consistency
 */
export const KLING_MULTIPROMPT_PIPELINE: PipelineGraph = {
  id: 'preset-kling-multiprompt',
  name: 'Kling Multi-Prompt',
  description: 'Kling 3.0 multi-shot generation. All scenes in one coherent video.',
  nodes: [
    {
      id: 'n-refs',
      type: 'ReferenceImages',
      position: { x: 50, y: 200 },
      config: {},
    },
    {
      id: 'n-enrich',
      type: 'PromptEnrich',
      position: { x: 50, y: 370 },
      config: {},
    },
    {
      id: 'n-batch',
      type: 'MultiPromptBatch',
      position: { x: 400, y: 250 },
      config: { aspectRatio: '16:9', generateAudio: true },
    },
    {
      id: 'n-stitch',
      type: 'Stitch',
      position: { x: 700, y: 250 },
      config: { transition: 'cut' },
    },
    {
      id: 'n-export',
      type: 'Export',
      position: { x: 960, y: 250 },
      config: { format: 'mp4' },
    },
  ],
  edges: [
    { id: 'e-1', sourceNodeId: 'n-refs', sourcePortId: 'refset', targetNodeId: 'n-batch', targetPortId: 'refset' },
    { id: 'e-2', sourceNodeId: 'n-enrich', sourcePortId: 'scenes', targetNodeId: 'n-batch', targetPortId: 'scenes' },
    { id: 'e-3', sourceNodeId: 'n-batch', sourcePortId: 'videos', targetNodeId: 'n-stitch', targetPortId: 'videos' },
    { id: 'e-4', sourceNodeId: 'n-stitch', sourcePortId: 'video', targetNodeId: 'n-export', targetPortId: 'video' },
  ],
};

/**
 * Ultra Pipeline — film-grade flow with control estimation, identity lock,
 * ControlNet generation, quality gate, progressive refinement, and VACE video.
 *
 * Flow:
 * References ──┬──> ControlEstimator ──> ControlPreview ──> ControlNetGen ──> IdentityLock ──> QualityGate ──> ProgressiveRefine ──> VACEVideoGen ──> Stitch ──> Export
 * ScenePrompt ─┘         │                                     ▲                  ▲
 *                    IPAdapterLock ──────────────────────────────┘                  │
 *                                                                                  │
 * (References refset feeds into QualityGate reference)                             │
 */
export const ULTRA_PIPELINE: PipelineGraph = {
  id: 'preset-ultra',
  name: 'Ultra Pipeline',
  description: 'Film-grade flow: AI control estimation, identity lock, ControlNet, quality gate, progressive refinement, VACE video.',
  nodes: [
    // Source
    {
      id: 'u-refs',
      type: 'ReferenceImages',
      position: { x: 50, y: 150 },
      config: {},
    },
    {
      id: 'u-prompt',
      type: 'ScenePrompt',
      position: { x: 50, y: 350 },
      config: { appendStyle: true },
    },
    // Control estimation
    {
      id: 'u-control-est',
      type: 'ControlEstimator',
      position: { x: 300, y: 150 },
      config: {},
    },
    // Control preview
    {
      id: 'u-control-preview',
      type: 'ControlPreview',
      position: { x: 550, y: 60 },
      config: { overlayMode: 'side-by-side', opacity: 0.5 },
    },
    // Style lock from hero frame
    {
      id: 'u-ip-adapter',
      type: 'IPAdapterLock',
      position: { x: 300, y: 350 },
      config: { strength: 0.8 },
    },
    // ControlNet generation
    {
      id: 'u-controlnet-gen',
      type: 'ControlNetGen',
      position: { x: 550, y: 230 },
      config: { model: 'flux-controlnet', controlType: 'depth', strength: 0.85, aspectRatio: '16:9' },
    },
    // Identity lock (PuLID)
    {
      id: 'u-identity-lock',
      type: 'IdentityLock',
      position: { x: 800, y: 230 },
      config: { strength: 0.9 },
    },
    // Quality gate (CLIP+ArcFace+DreamSim)
    {
      id: 'u-quality-gate',
      type: 'QualityGate',
      position: { x: 1050, y: 230 },
      config: { clipThreshold: 0.75, arcfaceThreshold: 0.85, dreamsimThreshold: 0.70, retryOnFail: true, maxRetries: 3 },
    },
    // Progressive refinement
    {
      id: 'u-progressive',
      type: 'ProgressiveRefine',
      position: { x: 1300, y: 230 },
      config: { targetStage: 'final', model: 'flux-2-pro', strength: 0.6 },
    },
    // VACE video generation
    {
      id: 'u-vace-video',
      type: 'VACEVideoGen',
      position: { x: 1550, y: 230 },
      config: { model: 'vace-14b', duration: 5, structureStrength: 0.8, aspectRatio: '16:9' },
    },
    // Stitch
    {
      id: 'u-stitch',
      type: 'Stitch',
      position: { x: 1800, y: 230 },
      config: { transition: 'cut' },
    },
    // Export
    {
      id: 'u-export',
      type: 'Export',
      position: { x: 2050, y: 230 },
      config: { format: 'mp4' },
    },
  ],
  edges: [
    // Refs image[0] → ControlEstimator (use first ref image for control estimation)
    { id: 'ue-1', sourceNodeId: 'u-refs', sourcePortId: 'refset', targetNodeId: 'u-control-est', targetPortId: 'image' },
    // ControlEstimator → ControlPreview
    { id: 'ue-2', sourceNodeId: 'u-control-est', sourcePortId: 'control_map', targetNodeId: 'u-control-preview', targetPortId: 'control_map' },
    // ControlEstimator → ControlNetGen (control map)
    { id: 'ue-3', sourceNodeId: 'u-control-est', sourcePortId: 'control_map', targetNodeId: 'u-controlnet-gen', targetPortId: 'control_map' },
    // Prompt → ControlNetGen
    { id: 'ue-4', sourceNodeId: 'u-prompt', sourcePortId: 'prompt', targetNodeId: 'u-controlnet-gen', targetPortId: 'prompt' },
    // Prompt → IPAdapterLock
    { id: 'ue-5', sourceNodeId: 'u-prompt', sourcePortId: 'prompt', targetNodeId: 'u-ip-adapter', targetPortId: 'prompt' },
    // Refs → IPAdapterLock (hero image for style lock)
    { id: 'ue-6', sourceNodeId: 'u-refs', sourcePortId: 'refset', targetNodeId: 'u-ip-adapter', targetPortId: 'image' },
    // ControlNetGen → IdentityLock
    { id: 'ue-7', sourceNodeId: 'u-controlnet-gen', sourcePortId: 'image', targetNodeId: 'u-identity-lock', targetPortId: 'image' },
    // Prompt → IdentityLock
    { id: 'ue-8', sourceNodeId: 'u-prompt', sourcePortId: 'prompt', targetNodeId: 'u-identity-lock', targetPortId: 'prompt' },
    // IdentityLock → QualityGate
    { id: 'ue-9', sourceNodeId: 'u-identity-lock', sourcePortId: 'image', targetNodeId: 'u-quality-gate', targetPortId: 'image' },
    // IPAdapterLock → QualityGate (as reference for scoring)
    { id: 'ue-10', sourceNodeId: 'u-ip-adapter', sourcePortId: 'image', targetNodeId: 'u-quality-gate', targetPortId: 'reference' },
    // QualityGate → ProgressiveRefine
    { id: 'ue-11', sourceNodeId: 'u-quality-gate', sourcePortId: 'image', targetNodeId: 'u-progressive', targetPortId: 'image' },
    // Prompt → ProgressiveRefine
    { id: 'ue-12', sourceNodeId: 'u-prompt', sourcePortId: 'prompt', targetNodeId: 'u-progressive', targetPortId: 'prompt' },
    // ProgressiveRefine → VACEVideoGen (start image)
    { id: 'ue-13', sourceNodeId: 'u-progressive', sourcePortId: 'image', targetNodeId: 'u-vace-video', targetPortId: 'image' },
    // Prompt → VACEVideoGen
    { id: 'ue-14', sourceNodeId: 'u-prompt', sourcePortId: 'prompt', targetNodeId: 'u-vace-video', targetPortId: 'prompt' },
    // ControlEstimator → VACEVideoGen (control map for structure awareness)
    { id: 'ue-15', sourceNodeId: 'u-control-est', sourcePortId: 'control_map', targetNodeId: 'u-vace-video', targetPortId: 'control_map' },
    // VACEVideoGen → Stitch
    { id: 'ue-16', sourceNodeId: 'u-vace-video', sourcePortId: 'video', targetNodeId: 'u-stitch', targetPortId: 'videos' },
    // Stitch → Export
    { id: 'ue-17', sourceNodeId: 'u-stitch', sourcePortId: 'video', targetNodeId: 'u-export', targetPortId: 'video' },
  ],
};

/**
 * All available presets
 */
export const PIPELINE_PRESETS: PipelineGraph[] = [
  DIRECTOR_PIPELINE,
  KLING_MULTIPROMPT_PIPELINE,
  ULTRA_PIPELINE,
];

export function getPreset(id: string): PipelineGraph | undefined {
  return PIPELINE_PRESETS.find((p) => p.id === id);
}
