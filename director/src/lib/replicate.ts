import Replicate from 'replicate';
import type { TrainingConfig, TrainingStatus, Prediction } from '@/types/replicate';
import { getImageModel, getVideoModel, type ImageModelDef, type VideoModelDef } from '@/lib/models';

function getClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }
  return new Replicate({ auth: token });
}

const MODELS = {
  trainer: 'ostris/flux-dev-lora-trainer',
  devLora: 'black-forest-labs/flux-dev-lora',
  schnell: 'black-forest-labs/flux-schnell',
  pro: 'black-forest-labs/flux-2-pro',
  video: 'kwaivgi/kling-v3-omni-video',
  edit: 'black-forest-labs/flux-fill-pro',
} as const;

export async function startTraining(config: TrainingConfig): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  const training = await replicate.trainings.create(
    'ostris',
    'flux-dev-lora-trainer',
    '26dce37af90b9d997eeb970d92e47de3064d46c300504ae376c75bef6a9022d2',
    {
      destination: `${process.env.REPLICATE_USERNAME || 'user'}/director-lora`,
      input: {
        input_images: config.inputZipUrl,
        trigger_word: config.triggerWord,
        steps: config.steps ?? 1000,
        learning_rate: config.learningRate ?? 0.0004,
        resolution: config.resolution ?? 512,
        autocaption: true,
      },
    }
  );

  return { id: training.id, status: training.status };
}

export async function getTraining(id: string): Promise<TrainingStatus> {
  const replicate = getClient();
  const training = await replicate.trainings.get(id);

  // Parse progress from logs if available
  let progress = 0;
  if (training.logs) {
    const match = training.logs.match(/(\d+)%/);
    if (match) progress = parseInt(match[1], 10);
  }
  if (training.status === 'succeeded') progress = 100;

  return {
    id: training.id,
    status: training.status as TrainingStatus['status'],
    model: MODELS.trainer,
    version: training.version ?? '',
    logs: training.logs ?? '',
    output: training.output
      ? { version: String((training.output as Record<string, unknown>).version ?? ''), weights: String((training.output as Record<string, unknown>).weights ?? '') }
      : null,
    error: training.error ? String(training.error) : null,
    progress,
  };
}

export async function generateImage(options: {
  prompt: string;
  loraUrl?: string;
  loraUrls?: { url: string; scale: number }[]; // Multi-LoRA blending
  imageModelId?: string;
  model?: 'schnell' | 'pro';
  aspectRatio?: string;
  seed?: number;
  referenceImages?: string[];
  conditioningWeights?: { url: string; weight: number; role: string }[];
  negativePrompt?: string;
}): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  // Resolve model from registry first (needed for input construction)
  const modelDef: ImageModelDef | undefined = options.imageModelId
    ? getImageModel(options.imageModelId)
    : undefined;

  const modelId = modelDef?.id ?? '';

  const input: Record<string, unknown> = {
    prompt: options.prompt,
    aspect_ratio: options.aspectRatio ?? '16:9',
  };

  // Seed — supported by FLUX Dev/Schnell, Ideogram, Wan. NOT Recraft V4 or FLUX 2 Pro.
  const noSeedModels = ['recraft-v4', 'flux-2-pro'];
  if (options.seed !== undefined && !noSeedModels.includes(modelId)) {
    input.seed = options.seed;
  }

  // Negative prompt — model-specific handling
  if (options.negativePrompt) {
    if (modelId === 'ideogram-v3') {
      // Ideogram v3 supports native negative_prompt
      input.negative_prompt = options.negativePrompt;
    } else if (modelId === 'recraft-v4') {
      // Recraft uses style_negative
      input.style_negative = options.negativePrompt;
    } else {
      // FLUX models: append avoidance cues to prompt for best results
      input.prompt = `${input.prompt}. Avoid: ${options.negativePrompt}`;
    }
  }

  // Reference images for conditioning (model-specific)
  if (options.referenceImages?.length) {
    if (modelId === 'flux-2-pro') {
      // FLUX 2 Pro uses input_images array
      input.input_images = options.referenceImages;
    } else if (modelId === 'flux-2-klein-9b-lora' || modelId === 'flux-2-klein-4b-lora') {
      // Klein models use images array
      input.images = options.referenceImages;
    } else if (modelId === 'ideogram-v3') {
      // Ideogram uses style_reference_images array
      input.style_reference_images = options.referenceImages;
    } else if (modelId === 'flux-dev-lora' || modelId === 'flux-schnell-lora') {
      // FLUX Dev/Schnell LoRA support image-to-image via `image` param
      input.image = options.referenceImages[0];
      input.prompt_strength = 0.75;
    }
    // flux-schnell and recraft-v4 don't support reference images — skip silently
  }

  // When LoRA(s) are provided, use a LoRA-compatible model
  const multiLora = options.loraUrls?.length ? options.loraUrls : options.loraUrl ? [{ url: options.loraUrl, scale: 0.8 }] : [];

  if (multiLora.length > 0) {
    const loraModel = (modelDef?.loraSupport
      ? modelDef
      : getImageModel('flux-dev-lora') ?? modelDef)!;

    const isKlein = loraModel.id === 'flux-2-klein-9b-lora' || loraModel.id === 'flux-2-klein-4b-lora';
    if (isKlein) {
      // Klein models support multi-LoRA natively via arrays
      input.lora_weights = multiLora.map((l) => l.url);
      input.lora_scales = multiLora.map((l) => l.scale);
    } else {
      // Non-Klein models only support single LoRA — use the first one
      input[loraModel.loraParam ?? 'lora_weights'] = multiLora[0].url;
      input.lora_scale = multiLora[0].scale;
    }

    const prediction = await replicate.predictions.create({
      model: loraModel.replicateId as `${string}/${string}`,
      input,
    });
    return { id: prediction.id, status: prediction.status };
  }

  // No LoRA — use selected model from registry, or fall back to legacy behavior
  const replicateModel = modelDef
    ? modelDef.replicateId
    : options.model === 'pro' ? MODELS.pro : MODELS.schnell;

  console.log(`[replicate] generateImage model=${replicateModel} imageModelId=${options.imageModelId}`);

  const prediction = await replicate.predictions.create({
    model: replicateModel as `${string}/${string}`,
    input,
  });

  return { id: prediction.id, status: prediction.status };
}

export async function generateVideo(options: {
  imageUrl: string;
  prompt?: string;
  duration?: number;
  mode?: 'standard' | 'pro';
  aspectRatio?: string;
  referenceImages?: string[];
  generateAudio?: boolean;
  videoModelId?: string;
  videoLoraUrl?: string;
  videoLoraScale?: number;
}): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  // Resolve model from registry
  const modelDef: VideoModelDef | undefined = options.videoModelId
    ? getVideoModel(options.videoModelId)
    : undefined;

  const mapping = modelDef?.inputMapping ?? { startImage: 'start_image', prompt: 'prompt', duration: 'duration' };
  const replicateModel = modelDef?.replicateId ?? MODELS.video;

  const input: Record<string, unknown> = {
    [mapping.startImage]: options.imageUrl,
  };

  // Only send aspect_ratio for models that support it (Kling, Wan 2.1)
  if (modelDef?.id === 'kling-3.0' || modelDef?.id === 'wan-2.1-720p' || !modelDef) {
    input.aspect_ratio = options.aspectRatio ?? '16:9';
  }

  if (mapping.duration) {
    let dur = options.duration ?? 5;
    // Wan 2.6 only accepts 5, 10, or 15 — snap to nearest valid value
    if (modelDef?.id?.startsWith('wan-2.6')) {
      dur = dur <= 7 ? 5 : dur <= 12 ? 10 : 15;
    }
    input[mapping.duration] = dur;
  }

  // Only send mode for Kling (other models don't have this param)
  if (modelDef?.id === 'kling-3.0' || !modelDef) {
    input.mode = options.mode ?? 'standard';
  }

  // Enable audio only for models that support it
  const supportsAudio = modelDef?.supportsAudio ?? false;
  if (supportsAudio) {
    // Wan 2.6 uses audio_enabled, Kling uses generate_audio
    const audioParam = modelDef?.id?.startsWith('wan-2.6') ? 'audio_enabled' : 'generate_audio';
    input[audioParam] = options.generateAudio ?? true;
  }

  if (options.prompt) input[mapping.prompt] = options.prompt;

  // Unified reference images (characters + environments + style — ordered by priority)
  // NOTE: subject_reference does NOT exist on Replicate's Kling model.
  // Total images (start_image + reference_images) must not exceed 7.
  if (options.referenceImages && options.referenceImages.length > 0 && (modelDef?.supportsReferenceImages ?? true)) {
    const maxRefs = options.imageUrl ? 6 : 7; // start_image counts toward the 7-image limit
    input.reference_images = options.referenceImages.slice(0, maxRefs);
  }

  // Video LoRA — inject trained weights for models that support it
  if (options.videoLoraUrl && modelDef?.supportsLoRA && modelDef.loraParam) {
    input[modelDef.loraParam] = options.videoLoraUrl;
    if (options.videoLoraScale !== undefined) {
      input.lora_strength = options.videoLoraScale;
    }
  }

  console.log(`[replicate] generateVideo model=${replicateModel} refs=${(input.reference_images as string[] | undefined)?.length ?? 0} videoLora=${!!options.videoLoraUrl}`);

  const prediction = await replicate.predictions.create({
    model: replicateModel as `${string}/${string}`,
    input,
  });

  return { id: prediction.id, status: prediction.status };
}

// ─── Multi-prompt video generation (Kling 3.0 only) ─────────────────

export async function generateMultiPromptVideo(options: {
  segments: { prompt: string; duration: number }[];
  referenceImages?: string[];
  startImageUrl?: string;
  mode?: 'standard' | 'pro';
  aspectRatio?: string;
  generateAudio?: boolean;
}): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  const totalDuration = options.segments.reduce((sum, s) => sum + s.duration, 0);
  if (options.segments.length > 6) throw new Error('multi_prompt supports max 6 segments');
  if (totalDuration > 15) throw new Error(`multi_prompt max 15s total, got ${totalDuration}s`);
  if (options.segments.some(s => s.duration < 3)) throw new Error('multi_prompt min 3s per segment');

  const input: Record<string, unknown> = {
    prompt: '',  // MUST be empty when using multi_prompt
    multi_prompt: JSON.stringify(options.segments.map(s => ({
      prompt: s.prompt.length > 500 ? s.prompt.slice(0, 500) : s.prompt,
      duration: s.duration,
    }))),
    mode: options.mode ?? 'standard',
    aspect_ratio: options.aspectRatio ?? '16:9',
    generate_audio: options.generateAudio ?? true,
  };

  if (options.startImageUrl) {
    input.start_image = options.startImageUrl;
  }

  // Total images (start_image + reference_images) must not exceed 7
  if (options.referenceImages && options.referenceImages.length > 0) {
    const maxRefs = options.startImageUrl ? 6 : 7;
    input.reference_images = options.referenceImages.slice(0, maxRefs);
  }

  console.log(`[replicate] generateMultiPromptVideo segments=${options.segments.length} totalDuration=${totalDuration}s refs=${options.referenceImages?.length ?? 0}`);

  const prediction = await replicate.predictions.create({
    model: 'kwaivgi/kling-v3-omni-video' as `${string}/${string}`,
    input,
  });

  return { id: prediction.id, status: prediction.status };
}

// ─── Video LoRA Training (CogVideoX / Hunyuan) ──────────────────────

export async function startVideoTraining(config: {
  inputZipUrl: string;
  triggerWord: string;
  steps?: number;
  learningRate?: number;
  targetModel: 'cogvideox-5b' | 'hunyuan-video';
}): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  // CogVideoX-5B LoRA training via community trainer
  // Hunyuan Video LoRA training via community trainer
  const trainerMap: Record<string, { owner: string; model: string }> = {
    'cogvideox-5b': { owner: 'zsxkib', model: 'cogvideox-lora-trainer' },
    'hunyuan-video': { owner: 'lucataco', model: 'hunyuanvideo-lora-trainer' },
  };

  const trainer = trainerMap[config.targetModel];
  if (!trainer) throw new Error(`No trainer available for ${config.targetModel}`);

  const input: Record<string, unknown> = {
    input_videos: config.inputZipUrl,
    trigger_word: config.triggerWord,
    max_train_steps: config.steps ?? 2000,
    learning_rate: config.learningRate ?? 0.0001,
  };

  const training = await replicate.trainings.create(
    trainer.owner,
    trainer.model,
    undefined as unknown as string, // Use latest version
    {
      destination: `${process.env.REPLICATE_USERNAME || 'user'}/director-video-lora`,
      input,
    }
  );

  return { id: training.id, status: training.status };
}

export async function editImage(
  imageUrl: string,
  maskUrl: string,
  prompt: string
): Promise<{ id: string; status: string }> {
  const replicate = getClient();

  const prediction = await replicate.predictions.create({
    model: MODELS.edit,
    input: {
      image: imageUrl,
      mask: maskUrl,
      prompt,
    },
  });

  return { id: prediction.id, status: prediction.status };
}

export async function getPrediction(id: string): Promise<Prediction> {
  const replicate = getClient();
  const prediction = await replicate.predictions.get(id);

  return {
    id: prediction.id,
    status: prediction.status as Prediction['status'],
    input: prediction.input as Record<string, unknown>,
    output: prediction.output as string | string[] | null,
    error: prediction.error ? String(prediction.error) : null,
    model: prediction.model ?? '',
    version: prediction.version ?? '',
  };
}

/**
 * Cancel an in-flight prediction. Silently succeeds if already terminal.
 */
export async function cancelPrediction(id: string): Promise<void> {
  const replicate = getClient();
  try {
    await replicate.predictions.cancel(id);
  } catch {
    // Prediction may already be completed/failed — that's fine
  }
}
