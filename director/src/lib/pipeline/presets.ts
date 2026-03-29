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
 * All available presets
 */
export const PIPELINE_PRESETS: PipelineGraph[] = [
  DIRECTOR_PIPELINE,
  KLING_MULTIPROMPT_PIPELINE,
];

export function getPreset(id: string): PipelineGraph | undefined {
  return PIPELINE_PRESETS.find((p) => p.id === id);
}
