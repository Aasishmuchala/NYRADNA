// ─── Node Type Registry ─────────────────────────────────────────────
//
// Defines all available node types for the pipeline editor.
// Execute functions are stubs in Phase 1, filled in during Phase 2.

import type { NodeTypeDef } from './types';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/models';
import {
  executeReferenceImages,
  executeScenePrompt,
  executeImageGen,
  executeVideoGen,
  executeMultiPromptBatch,
  executeAudioGen,
  executeFaceGate,
  executeStyleGate,
  executeDriftGate,
  executeFrameExtract,
  executePromptEnrich,
  executeStitch,
  executeExport,
} from './nodeExecutors';
import {
  executeControlEstimator,
  executeControlNetGen,
  executeVACEVideoGen,
  executeIPAdapterLock,
  executeSceneComposer3D,
  executeControlPreview,
  executeIdentityLock,
  executeQualityGate,
  executeProgressiveRefine,
} from './ultraNodeExecutors';

// ─── Source Nodes ───────────────────────────────────────────────────

const ReferenceImages: NodeTypeDef = {
  type: 'ReferenceImages',
  category: 'source',
  label: 'Reference Images',
  description: 'Builds ordered reference image set from production assets (characters first, environments second)',
  icon: 'collections',
  inputs: [],
  outputs: [
    { id: 'refset', label: 'Ref Set', dataType: 'refset', required: false },
    { id: 'count', label: 'Count', dataType: 'number', required: false },
  ],
  config: [],
  execute: executeReferenceImages,
};

const ScenePrompt: NodeTypeDef = {
  type: 'ScenePrompt',
  category: 'source',
  label: 'Scene Prompt',
  description: 'Generates cinematic prompt from base text with style/lighting/camera suffixes',
  icon: 'edit_note',
  inputs: [
    { id: 'base_text', label: 'Base Text', dataType: 'text', required: false, default: '' },
  ],
  outputs: [
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false },
  ],
  config: [
    { id: 'appendStyle', label: 'Append Style Suffix', type: 'boolean', default: true },
  ],
  execute: executeScenePrompt,
};

// ─── Generation Nodes ───────────────────────────────────────────────

const ImageGen: NodeTypeDef = {
  type: 'ImageGen',
  category: 'generation',
  label: 'Image Gen',
  description: 'Generates an image from prompt using selected model (FLUX, Ideogram, Recraft)',
  icon: 'image',
  inputs: [
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: true },
    { id: 'refset', label: 'Ref Images', dataType: 'refset', required: false },
  ],
  outputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'model',
      label: 'Image Model',
      type: 'select',
      options: IMAGE_MODELS.map((m) => ({ value: m.id, label: m.name })),
      default: 'flux-dev-lora',
    },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9 (Landscape)' },
        { value: '9:16', label: '9:16 (Portrait)' },
        { value: '1:1', label: '1:1 (Square)' },
      ],
      default: '16:9',
    },
    { id: 'seed', label: 'Seed', type: 'number', default: -1, min: -1, max: 999999 },
  ],
  forEach: true,
  execute: executeImageGen,
};

const VideoGen: NodeTypeDef = {
  type: 'VideoGen',
  category: 'generation',
  label: 'Video Gen',
  description: 'Generates video from image + prompt using selected model (Kling, Wan, Hailuo)',
  icon: 'movie',
  inputs: [
    { id: 'image', label: 'Start Image', dataType: 'image', required: true },
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false, default: '' },
    { id: 'refset', label: 'Ref Images', dataType: 'refset', required: false },
  ],
  outputs: [
    { id: 'video', label: 'Video', dataType: 'video', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'model',
      label: 'Video Model',
      type: 'select',
      options: VIDEO_MODELS.map((m) => ({ value: m.id, label: m.name })),
      default: 'kling-3.0',
    },
    { id: 'duration', label: 'Duration (s)', type: 'number', default: 5, min: 2, max: 10 },
    { id: 'generateAudio', label: 'Generate Audio', type: 'boolean', default: false },
  ],
  forEach: true,
  execute: executeVideoGen,
};

const MultiPromptBatch: NodeTypeDef = {
  type: 'MultiPromptBatch',
  category: 'generation',
  label: 'Multi-Prompt Batch',
  description: 'Kling 3.0: generates multiple connected shots as ONE coherent video (max 6 segments, 15s)',
  icon: 'view_timeline',
  inputs: [
    { id: 'scenes', label: 'Scenes', dataType: 'scene[]', required: true },
    { id: 'refset', label: 'Ref Images', dataType: 'refset', required: false },
    { id: 'start_image', label: 'Start Image', dataType: 'image', required: false },
  ],
  outputs: [
    { id: 'videos', label: 'Videos', dataType: 'video[]', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '1:1', label: '1:1' },
      ],
      default: '16:9',
    },
    { id: 'generateAudio', label: 'Generate Audio', type: 'boolean', default: true },
  ],
  execute: executeMultiPromptBatch,
};

const AudioGen: NodeTypeDef = {
  type: 'AudioGen',
  category: 'generation',
  label: 'Audio Gen',
  description: 'Generates voiceover or soundtrack from text script',
  icon: 'mic',
  inputs: [
    { id: 'script', label: 'Script', dataType: 'text', required: true },
  ],
  outputs: [
    { id: 'audio', label: 'Audio', dataType: 'audio', required: false },
  ],
  config: [
    {
      id: 'voice',
      label: 'Voice',
      type: 'select',
      options: [
        { value: 'alloy', label: 'Alloy' },
        { value: 'echo', label: 'Echo' },
        { value: 'fable', label: 'Fable' },
        { value: 'onyx', label: 'Onyx' },
        { value: 'nova', label: 'Nova' },
        { value: 'shimmer', label: 'Shimmer' },
      ],
      default: 'alloy',
    },
  ],
  execute: executeAudioGen,
};

// ─── Quality Gate Nodes ─────────────────────────────────────────────

const FaceGate: NodeTypeDef = {
  type: 'FaceGate',
  category: 'gate',
  label: 'Face Gate',
  description: 'Checks character consistency against reference. Blocks if face similarity < threshold.',
  icon: 'face_retouching_natural',
  inputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: true },
    { id: 'refset', label: 'Ref Images', dataType: 'refset', required: true },
  ],
  outputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: false },
    { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
    { id: 'score', label: 'Score', dataType: 'number', required: false },
  ],
  config: [
    { id: 'threshold', label: 'Threshold', type: 'slider', default: 0.90, min: 0.5, max: 1.0, step: 0.01 },
    { id: 'retryOnFail', label: 'Auto-Retry on Fail', type: 'boolean', default: true },
    { id: 'maxRetries', label: 'Max Retries', type: 'number', default: 3, min: 1, max: 5 },
  ],
  execute: executeFaceGate,
};

const StyleGate: NodeTypeDef = {
  type: 'StyleGate',
  category: 'gate',
  label: 'Style Gate',
  description: 'Checks lighting, composition, and color consistency against style references',
  icon: 'palette',
  inputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: true },
    { id: 'refset', label: 'Ref Images', dataType: 'refset', required: true },
  ],
  outputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: false },
    { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
    { id: 'score', label: 'Score', dataType: 'number', required: false },
  ],
  config: [
    { id: 'checkLighting', label: 'Check Lighting', type: 'boolean', default: true },
    { id: 'checkColorTemp', label: 'Check Color Temp', type: 'boolean', default: true },
    { id: 'compositionFloor', label: 'Min Composition Quality', type: 'slider', default: 0.40, min: 0.1, max: 1.0, step: 0.05 },
    { id: 'retryOnFail', label: 'Auto-Retry on Fail', type: 'boolean', default: false },
    { id: 'maxRetries', label: 'Max Retries', type: 'number', default: 2, min: 1, max: 5 },
  ],
  execute: executeStyleGate,
};

const DriftGate: NodeTypeDef = {
  type: 'DriftGate',
  category: 'gate',
  label: 'Drift Gate',
  description: 'Checks semantic drift between consecutive clip descriptions. Blocks if similarity too low.',
  icon: 'compare',
  inputs: [
    { id: 'prev_text', label: 'Previous Desc', dataType: 'text', required: true },
    { id: 'curr_text', label: 'Current Desc', dataType: 'text', required: true },
  ],
  outputs: [
    { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
    { id: 'similarity', label: 'Similarity', dataType: 'number', required: false },
  ],
  config: [
    { id: 'threshold', label: 'Threshold', type: 'slider', default: 0.55, min: 0.3, max: 0.8, step: 0.05 },
  ],
  execute: executeDriftGate,
};

// ─── Processing Nodes ───────────────────────────────────────────────

const FrameExtract: NodeTypeDef = {
  type: 'FrameExtract',
  category: 'processing',
  label: 'Frame Extract',
  description: 'Extracts a frame from video (first, middle, or last) for continuity anchoring',
  icon: 'crop_original',
  inputs: [
    { id: 'video', label: 'Video', dataType: 'video', required: true },
  ],
  outputs: [
    { id: 'frame', label: 'Frame', dataType: 'frame', required: false },
    { id: 'duration', label: 'Duration', dataType: 'number', required: false },
  ],
  config: [
    {
      id: 'position',
      label: 'Position',
      type: 'select',
      options: [
        { value: 'first', label: 'First Frame' },
        { value: 'middle', label: 'Middle Frame' },
        { value: 'last', label: 'Last Frame' },
      ],
      default: 'last',
    },
  ],
  forEach: true,
  execute: executeFrameExtract,
};

const PromptEnrich: NodeTypeDef = {
  type: 'PromptEnrich',
  category: 'processing',
  label: 'Director AI',
  description: 'Enriches scene prompts using Director AI (adds video motion, narrative, cinematic direction)',
  icon: 'auto_fix_high',
  inputs: [
    { id: 'scenes', label: 'Scenes', dataType: 'scene[]', required: false, default: [] },
  ],
  outputs: [
    { id: 'scenes', label: 'Enriched Scenes', dataType: 'scene[]', required: false },
  ],
  config: [],
  execute: executePromptEnrich,
};

const Stitch: NodeTypeDef = {
  type: 'Stitch',
  category: 'processing',
  label: 'Stitch',
  description: 'Combines video clips + optional audio into final film with transitions',
  icon: 'content_cut',
  inputs: [
    { id: 'videos', label: 'Videos', dataType: 'video[]', required: true },
    { id: 'audio', label: 'Audio', dataType: 'audio', required: false },
  ],
  outputs: [
    { id: 'video', label: 'Final Film', dataType: 'video', required: false },
  ],
  config: [
    {
      id: 'transition',
      label: 'Transition',
      type: 'select',
      options: [
        { value: 'cut', label: 'Hard Cut' },
        { value: 'dissolve', label: 'Dissolve' },
        { value: 'fade', label: 'Fade to Black' },
      ],
      default: 'cut',
    },
  ],
  execute: executeStitch,
};

// ─── Output Nodes ───────────────────────────────────────────────────

const Export: NodeTypeDef = {
  type: 'Export',
  category: 'output',
  label: 'Export',
  description: 'Saves the final video to the project and prepares for download/share',
  icon: 'download',
  inputs: [
    { id: 'video', label: 'Video', dataType: 'video', required: true },
  ],
  outputs: [],
  config: [
    {
      id: 'format',
      label: 'Format',
      type: 'select',
      options: [
        { value: 'mp4', label: 'MP4' },
        { value: 'webm', label: 'WebM' },
      ],
      default: 'mp4',
    },
  ],
  execute: executeExport,
};

// ─── Ultra Mode: Source Nodes ───────────────────────────────────────

const ControlEstimator: NodeTypeDef = {
  type: 'ControlEstimator',
  category: 'source',
  label: 'Control Estimator',
  description: 'AI-estimates depth + pose control maps from a reference image for structure-aware generation',
  icon: 'layers',
  inputs: [
    { id: 'image', label: 'Reference Image', dataType: 'image', required: true },
  ],
  outputs: [
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
    { id: 'depth_map', label: 'Depth Map', dataType: 'image', required: false },
    { id: 'pose_map', label: 'Pose Map', dataType: 'image', required: false },
  ],
  config: [],
  execute: executeControlEstimator,
};

const SceneComposer3D: NodeTypeDef = {
  type: 'SceneComposer3D',
  category: 'source',
  label: '3D Scene Composer',
  description: 'Placeholder for Phase 3 Three.js-based 3D scene layout and control map export',
  icon: 'view_in_ar',
  inputs: [],
  outputs: [
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
  ],
  config: [
    { id: 'scenePreset', label: 'Scene Preset', type: 'select', options: [
      { value: 'empty', label: 'Empty Scene' },
      { value: 'interior', label: 'Interior Room' },
      { value: 'exterior', label: 'Exterior Street' },
      { value: 'studio', label: 'Studio Setup' },
    ], default: 'empty' },
  ],
  execute: executeSceneComposer3D,
};

// ─── Ultra Mode: Generation Nodes ──────────────────────────────────

const ControlNetGen: NodeTypeDef = {
  type: 'ControlNetGen',
  category: 'generation',
  label: 'ControlNet Gen',
  description: 'Generates image conditioned on control signals (depth, pose, canny) for structure-aware output',
  icon: 'tune',
  inputs: [
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: true },
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
  ],
  outputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'model',
      label: 'ControlNet Model',
      type: 'select',
      options: [
        { value: 'flux-controlnet', label: 'FLUX ControlNet' },
        { value: 'flux-canny-pro', label: 'FLUX Canny Pro' },
        { value: 'flux-depth-pro', label: 'FLUX Depth Pro' },
        { value: 'controlnet-union-pro', label: 'ControlNet Union Pro' },
        { value: 'sdxl-multi-controlnet', label: 'SDXL Multi-ControlNet' },
      ],
      default: 'flux-controlnet',
    },
    {
      id: 'controlType',
      label: 'Control Type',
      type: 'select',
      options: [
        { value: 'depth', label: 'Depth' },
        { value: 'pose', label: 'Pose' },
        { value: 'canny', label: 'Canny Edge' },
      ],
      default: 'depth',
    },
    { id: 'strength', label: 'Control Strength', type: 'slider', default: 0.85, min: 0.1, max: 1.0, step: 0.05 },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9 (Landscape)' },
        { value: '9:16', label: '9:16 (Portrait)' },
        { value: '1:1', label: '1:1 (Square)' },
      ],
      default: '16:9',
    },
  ],
  execute: executeControlNetGen,
};

const VACEVideoGen: NodeTypeDef = {
  type: 'VACEVideoGen',
  category: 'generation',
  label: 'VACE Video Gen',
  description: 'WAN VACE structure-aware video generation with control signal conditioning',
  icon: 'slow_motion_video',
  inputs: [
    { id: 'image', label: 'Start Image', dataType: 'image', required: true },
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false, default: '' },
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
  ],
  outputs: [
    { id: 'video', label: 'Video', dataType: 'video', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'model',
      label: 'VACE Model',
      type: 'select',
      options: [
        { value: 'vace-14b', label: 'VACE 14B' },
      ],
      default: 'vace-14b',
    },
    { id: 'duration', label: 'Duration (s)', type: 'number', default: 5, min: 2, max: 15 },
    { id: 'structureStrength', label: 'Structure Strength', type: 'slider', default: 0.8, min: 0.1, max: 1.0, step: 0.05 },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '1:1', label: '1:1' },
      ],
      default: '16:9',
    },
  ],
  forEach: true,
  execute: executeVACEVideoGen,
};

// ─── Ultra Mode: Processing Nodes ──────────────────────────────────

const IPAdapterLock: NodeTypeDef = {
  type: 'IPAdapterLock',
  category: 'processing',
  label: 'IP-Adapter Lock',
  description: 'Style lock from hero frame using IP-Adapter for consistent visual identity',
  icon: 'style',
  inputs: [
    { id: 'image', label: 'Hero Image', dataType: 'image', required: true },
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false, default: '' },
  ],
  outputs: [
    { id: 'image', label: 'Locked Image', dataType: 'image', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    { id: 'strength', label: 'Lock Strength', type: 'slider', default: 0.8, min: 0.1, max: 1.0, step: 0.05 },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '1:1', label: '1:1' },
      ],
      default: '16:9',
    },
  ],
  execute: executeIPAdapterLock,
};

const ControlPreview: NodeTypeDef = {
  type: 'ControlPreview',
  category: 'processing',
  label: 'Control Preview',
  description: 'Side-by-side overlay preview of control maps against source image',
  icon: 'compare',
  inputs: [
    { id: 'image', label: 'Source Image', dataType: 'image', required: false },
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
  ],
  outputs: [
    { id: 'preview', label: 'Preview', dataType: 'image', required: false },
    { id: 'control_map', label: 'Control Map', dataType: 'control_map', required: false },
  ],
  config: [
    {
      id: 'overlayMode',
      label: 'Overlay Mode',
      type: 'select',
      options: [
        { value: 'side-by-side', label: 'Side by Side' },
        { value: 'overlay', label: 'Overlay' },
        { value: 'split', label: 'Split View' },
      ],
      default: 'side-by-side',
    },
    { id: 'opacity', label: 'Overlay Opacity', type: 'slider', default: 0.5, min: 0.0, max: 1.0, step: 0.1 },
  ],
  execute: executeControlPreview,
};

const IdentityLock: NodeTypeDef = {
  type: 'IdentityLock',
  category: 'processing',
  label: 'Identity Lock',
  description: 'PuLID face identity preservation -- locks facial features for cross-scene consistency',
  icon: 'face_retouching_natural',
  inputs: [
    { id: 'image', label: 'Face Image', dataType: 'image', required: true },
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false, default: '' },
  ],
  outputs: [
    { id: 'image', label: 'Locked Image', dataType: 'image', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
  ],
  config: [
    { id: 'strength', label: 'Identity Strength', type: 'slider', default: 0.9, min: 0.1, max: 1.0, step: 0.05 },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: [
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '1:1', label: '1:1' },
      ],
      default: '16:9',
    },
  ],
  execute: executeIdentityLock,
};

const QualityGate: NodeTypeDef = {
  type: 'QualityGate',
  category: 'processing',
  label: 'Quality Gate',
  description: 'CLIP + ArcFace + DreamSim multi-metric quality scoring against reference',
  icon: 'verified',
  inputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: true },
    { id: 'reference', label: 'Reference Image', dataType: 'image', required: false },
  ],
  outputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: false },
    { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
    { id: 'scores', label: 'Scores', dataType: 'score', required: false },
    { id: 'overall', label: 'Overall', dataType: 'number', required: false },
  ],
  config: [
    { id: 'clipThreshold', label: 'CLIP Threshold', type: 'slider', default: 0.75, min: 0.3, max: 1.0, step: 0.05 },
    { id: 'arcfaceThreshold', label: 'ArcFace Threshold', type: 'slider', default: 0.85, min: 0.3, max: 1.0, step: 0.05 },
    { id: 'dreamsimThreshold', label: 'DreamSim Threshold', type: 'slider', default: 0.70, min: 0.3, max: 1.0, step: 0.05 },
    { id: 'retryOnFail', label: 'Auto-Retry on Fail', type: 'boolean', default: true },
    { id: 'maxRetries', label: 'Max Retries', type: 'number', default: 3, min: 1, max: 5 },
  ],
  execute: executeQualityGate,
};

const ProgressiveRefine: NodeTypeDef = {
  type: 'ProgressiveRefine',
  category: 'processing',
  label: 'Progressive Refine',
  description: '4-stage quality ladder (draft -> refined -> polished -> final) for iterative improvement',
  icon: 'auto_awesome',
  inputs: [
    { id: 'image', label: 'Image', dataType: 'image', required: true },
    { id: 'prompt', label: 'Prompt', dataType: 'text', required: false, default: '' },
  ],
  outputs: [
    { id: 'image', label: 'Refined Image', dataType: 'image', required: false },
    { id: 'prediction_id', label: 'Prediction ID', dataType: 'text', required: false },
    { id: 'stage', label: 'Stage', dataType: 'text', required: false },
  ],
  config: [
    {
      id: 'targetStage',
      label: 'Target Stage',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft (1 pass)' },
        { value: 'refined', label: 'Refined (2 passes)' },
        { value: 'polished', label: 'Polished (3 passes)' },
        { value: 'final', label: 'Final (4 passes)' },
      ],
      default: 'final',
    },
    {
      id: 'model',
      label: 'Refine Model',
      type: 'select',
      options: IMAGE_MODELS.map((m) => ({ value: m.id, label: m.name })),
      default: 'flux-2-pro',
    },
    { id: 'strength', label: 'Refine Strength', type: 'slider', default: 0.6, min: 0.1, max: 1.0, step: 0.05 },
  ],
  execute: executeProgressiveRefine,
};

// ─── Registry ───────────────────────────────────────────────────────

const ALL_NODE_TYPES: NodeTypeDef[] = [
  // Source
  ReferenceImages,
  ScenePrompt,
  ControlEstimator,
  SceneComposer3D,
  // Generation
  ImageGen,
  VideoGen,
  MultiPromptBatch,
  AudioGen,
  ControlNetGen,
  VACEVideoGen,
  // Gate
  FaceGate,
  StyleGate,
  DriftGate,
  // Processing
  FrameExtract,
  PromptEnrich,
  Stitch,
  IPAdapterLock,
  ControlPreview,
  IdentityLock,
  QualityGate,
  ProgressiveRefine,
  // Output
  Export,
];

/** Map of type string → NodeTypeDef for quick lookup */
export const NODE_TYPE_REGISTRY = new Map<string, NodeTypeDef>(
  ALL_NODE_TYPES.map((def) => [def.type, def]),
);

/** All node types as an array */
export const NODE_TYPES = ALL_NODE_TYPES;

/** Get a node type definition by its type string */
export function getNodeType(type: string): NodeTypeDef | undefined {
  return NODE_TYPE_REGISTRY.get(type);
}

/** Get all node types in a specific category */
export function getNodesByCategory(category: NodeTypeDef['category']): NodeTypeDef[] {
  return ALL_NODE_TYPES.filter((def) => def.category === category);
}

/** Build default config for a node type */
export function getDefaultConfig(type: string): Record<string, unknown> {
  const def = NODE_TYPE_REGISTRY.get(type);
  if (!def) return {};
  const config: Record<string, unknown> = {};
  for (const field of def.config) {
    config[field.id] = field.default;
  }
  return config;
}
