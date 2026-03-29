// ─── Image Generation Models ───────────────────────────────────────

export interface ImageModelDef {
  id: string;
  name: string;
  replicateId: string;
  loraSupport: boolean;
  loraParam?: string; // param name for LoRA weights
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'ultra';
  costTier: '$' | '$$' | '$$$';
}

export const IMAGE_MODELS: ImageModelDef[] = [
  // LoRA-compatible models
  {
    id: 'flux-dev-lora',
    name: 'FLUX.1 Dev LoRA',
    replicateId: 'black-forest-labs/flux-dev-lora',
    loraSupport: true,
    loraParam: 'lora_weights',
    description: 'Best for character consistency with trained LoRA. High quality, slower.',
    speed: 'medium',
    quality: 'high',
    costTier: '$$',
  },
  {
    id: 'flux-2-klein-9b-lora',
    name: 'FLUX.2 Klein 9B LoRA',
    replicateId: 'black-forest-labs/flux-2-klein-9b-base-lora',
    loraSupport: true,
    loraParam: 'lora_weights',
    description: 'Latest FLUX.2 undistilled model. Better LoRA fidelity, diverse outputs.',
    speed: 'medium',
    quality: 'ultra',
    costTier: '$$$',
  },
  {
    id: 'flux-2-klein-4b-lora',
    name: 'FLUX.2 Klein 4B LoRA',
    replicateId: 'black-forest-labs/flux-2-klein-4b-base-lora',
    loraSupport: true,
    loraParam: 'lora_weights',
    description: 'Smaller FLUX.2 model. Faster than 9B, still good LoRA support.',
    speed: 'fast',
    quality: 'high',
    costTier: '$$',
  },
  {
    id: 'flux-schnell-lora',
    name: 'FLUX.1 Schnell LoRA',
    replicateId: 'black-forest-labs/flux-schnell-lora',
    loraSupport: true,
    loraParam: 'lora_weights',
    description: 'Fast LoRA inference on Schnell. Official model, use fewer steps (4) for speed.',
    speed: 'fast',
    quality: 'standard',
    costTier: '$',
  },
  // Non-LoRA models
  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell',
    replicateId: 'black-forest-labs/flux-schnell',
    loraSupport: false,
    description: 'Fastest FLUX model. Great for quick iterations, no character LoRA.',
    speed: 'fast',
    quality: 'standard',
    costTier: '$',
  },
  {
    id: 'flux-2-pro',
    name: 'FLUX.2 Pro',
    replicateId: 'black-forest-labs/flux-2-pro',
    loraSupport: false,
    description: 'Highest quality FLUX model. No LoRA but excellent general image gen.',
    speed: 'slow',
    quality: 'ultra',
    costTier: '$$$',
  },
  {
    id: 'ideogram-v3',
    name: 'Ideogram v3 Balanced',
    replicateId: 'ideogram-ai/ideogram-v3-balanced',
    loraSupport: false,
    description: 'Best for text rendering, logos, posters. Balanced speed/quality.',
    speed: 'medium',
    quality: 'high',
    costTier: '$$',
  },
  {
    id: 'recraft-v4',
    name: 'Recraft V4',
    replicateId: 'recraft-ai/recraft-v4',
    loraSupport: false,
    description: 'Art-directed output. Great for brand assets and editorial photography.',
    speed: 'medium',
    quality: 'ultra',
    costTier: '$$$',
  },
];

// ─── Video Generation Models ───────────────────────────────────────

export interface VideoModelDef {
  id: string;
  name: string;
  replicateId: string;
  supportsImageToVideo: boolean;
  supportsReferenceImages: boolean;
  supportsAudio: boolean;
  supportsMultiPrompt?: boolean;
  maxMultiPromptSegments?: number;   // max shots per multi_prompt (6 for Kling)
  maxMultiPromptDuration?: number;   // max total seconds across all segments (15 for Kling)
  supportsLoRA?: boolean;            // can accept LoRA weights for fine-tuned generation
  loraParam?: string;                // param name for LoRA weights
  maxDuration: number;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'ultra';
  costTier: '$' | '$$' | '$$$';
  inputMapping: {
    startImage: string;
    prompt: string;
    duration?: string;
  };
}

export const VIDEO_MODELS: VideoModelDef[] = [
  {
    id: 'kling-3.0',
    name: 'Kling 3.0 Omni',
    replicateId: 'kwaivgi/kling-v3-omni-video',
    supportsImageToVideo: true,
    supportsReferenceImages: true,
    supportsAudio: true,
    supportsMultiPrompt: true,
    maxMultiPromptSegments: 6,
    maxMultiPromptDuration: 15,
    maxDuration: 10,
    description: 'Best overall. 4K/60fps, multi-shot, native audio, reference images for consistency.',
    speed: 'medium',
    quality: 'ultra',
    costTier: '$$$',
    inputMapping: { startImage: 'start_image', prompt: 'prompt', duration: 'duration' },
  },
  {
    id: 'hailuo-2.3',
    name: 'MiniMax Hailuo 2.3',
    replicateId: 'minimax/hailuo-2.3',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    maxDuration: 10,
    description: 'Latest MiniMax. Realistic motion, high-fidelity stylization. Up to 1080p.',
    speed: 'medium',
    quality: 'high',
    costTier: '$$',
    inputMapping: { startImage: 'first_frame_image', prompt: 'prompt' },
  },
  {
    id: 'hailuo-2.3-fast',
    name: 'MiniMax Hailuo 2.3 Fast',
    replicateId: 'minimax/hailuo-2.3-fast',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    maxDuration: 10,
    description: 'Lower-latency Hailuo 2.3. Same quality, faster inference.',
    speed: 'fast',
    quality: 'high',
    costTier: '$$',
    inputMapping: { startImage: 'first_frame_image', prompt: 'prompt' },
  },
  {
    id: 'wan-2.6-flash',
    name: 'Wan 2.6 I2V Flash',
    replicateId: 'wan-video/wan2.6-i2v-flash',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: true,
    maxDuration: 15,
    description: 'Latest Wan. Up to 15s, 1080p, native audio. Fast inference.',
    speed: 'fast',
    quality: 'high',
    costTier: '$',
    inputMapping: { startImage: 'image', prompt: 'prompt', duration: 'duration' },
  },
  {
    id: 'wan-2.6',
    name: 'Wan 2.6 I2V',
    replicateId: 'wan-video/wan-2.6-i2v',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    maxDuration: 15,
    description: 'Latest Wan standard. Up to 15s, 1080p. Higher quality, slower than flash.',
    speed: 'medium',
    quality: 'ultra',
    costTier: '$$',
    inputMapping: { startImage: 'image', prompt: 'prompt', duration: 'duration' },
  },
  {
    id: 'wan-2.1-720p',
    name: 'Wan 2.1 I2V 720p',
    replicateId: 'wavespeedai/wan-2.1-i2v-720p',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    maxDuration: 5,
    description: 'Open-source, competitive quality. Good balance of speed and quality.',
    speed: 'fast',
    quality: 'high',
    costTier: '$',
    inputMapping: { startImage: 'image', prompt: 'prompt' },
  },
  {
    id: 'minimax-video-01',
    name: 'MiniMax Video-01 Live',
    replicateId: 'minimax/video-01-live',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    maxDuration: 6,
    description: 'Fast and reliable. Good for quick previews.',
    speed: 'fast',
    quality: 'standard',
    costTier: '$',
    inputMapping: { startImage: 'first_frame_image', prompt: 'prompt' }, // no duration param
  },
  // LoRA-capable video models
  {
    id: 'cogvideox-5b',
    name: 'CogVideoX-5B',
    replicateId: 'cuuupid/cogvideox-5b',
    supportsImageToVideo: true,
    supportsReferenceImages: false,
    supportsAudio: false,
    supportsLoRA: true,
    loraParam: 'lora_url',
    maxDuration: 6,
    description: 'Open-source video model with LoRA support. Train your own character for video.',
    speed: 'slow',
    quality: 'high',
    costTier: '$$',
    inputMapping: { startImage: 'image', prompt: 'prompt' },
  },
  {
    id: 'hunyuan-video',
    name: 'Hunyuan Video',
    replicateId: 'tencent/hunyuan-video',
    supportsImageToVideo: false,
    supportsReferenceImages: false,
    supportsAudio: false,
    supportsLoRA: true,
    loraParam: 'lora_url',
    maxDuration: 5,
    description: 'Tencent video model. High quality text-to-video with LoRA fine-tuning support.',
    speed: 'slow',
    quality: 'ultra',
    costTier: '$$$',
    inputMapping: { startImage: 'image', prompt: 'prompt' },
  },
];

// ─── Lookup Maps (O(1) instead of O(n) per call) ───────────────────

const _imageModelMap = new Map<string, ImageModelDef>(
  IMAGE_MODELS.map((m) => [m.id, m]),
);

const _videoModelMap = new Map<string, VideoModelDef>(
  VIDEO_MODELS.map((m) => [m.id, m]),
);

// ─── Helpers ───────────────────────────────────────────────────────

export function getImageModel(id: string): ImageModelDef | undefined {
  return _imageModelMap.get(id);
}

export function getVideoModel(id: string): VideoModelDef | undefined {
  return _videoModelMap.get(id);
}

export function getLoraCompatibleModels(): ImageModelDef[] {
  return IMAGE_MODELS.filter((m) => m.loraSupport);
}

export function getBestModelForLora(): ImageModelDef {
  const model = IMAGE_MODELS.find((m) => m.id === 'flux-dev-lora');
  if (!model) throw new Error('flux-dev-lora model not found in IMAGE_MODELS registry');
  return model;
}

export function getVideoLoraModels(): VideoModelDef[] {
  return VIDEO_MODELS.filter((m) => m.supportsLoRA);
}
