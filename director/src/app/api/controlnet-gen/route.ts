import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const MODEL_MAP: Record<string, string> = {
  'flux-depth-pro': 'black-forest-labs/flux-depth-pro',
  'flux-canny-pro': 'black-forest-labs/flux-canny-pro',
  'controlnet-union-pro': 'lucataco/controlnet-union-pro',
  'flux-controlnet': 'xlabs-ai/flux-dev-controlnet',
  'sdxl-multi-controlnet': 'fofr/sdxl-multi-controlnet-lora',
};

const VALID_MODELS = new Set(Object.keys(MODEL_MAP));
const MAX_PROMPT_LENGTH = 10000;
const MAX_CONTROL_IMAGES = 4;

interface ControlImage {
  url: string;
  type: string;
  strength: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, controlImages, model, aspectRatio, seed, loraUrl, anchorImage } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required and must be a string' },
        { status: 400 },
      );
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `prompt exceeds ${MAX_PROMPT_LENGTH} character limit` },
        { status: 400 },
      );
    }

    if (!model || !VALID_MODELS.has(model)) {
      return NextResponse.json(
        { error: `model is required and must be one of: ${[...VALID_MODELS].join(', ')}` },
        { status: 400 },
      );
    }

    if (!controlImages || !Array.isArray(controlImages) || controlImages.length === 0) {
      return NextResponse.json(
        { error: 'controlImages is required and must be a non-empty array' },
        { status: 400 },
      );
    }
    if (controlImages.length > MAX_CONTROL_IMAGES) {
      return NextResponse.json(
        { error: `controlImages must have at most ${MAX_CONTROL_IMAGES} items` },
        { status: 400 },
      );
    }

    // Validate each control image
    for (let i = 0; i < controlImages.length; i++) {
      const ci = controlImages[i] as ControlImage;
      if (!ci.url || typeof ci.url !== 'string') {
        return NextResponse.json(
          { error: `controlImages[${i}].url is required` },
          { status: 400 },
        );
      }
      const urlCheck = validateUrl(ci.url, { allowDataUri: true });
      if (!urlCheck.valid) {
        return NextResponse.json(
          { error: `Invalid controlImages[${i}].url: ${urlCheck.error}` },
          { status: 400 },
        );
      }
      if (!ci.type || typeof ci.type !== 'string') {
        return NextResponse.json(
          { error: `controlImages[${i}].type is required` },
          { status: 400 },
        );
      }
      if (typeof ci.strength !== 'number' || ci.strength < 0 || ci.strength > 2) {
        return NextResponse.json(
          { error: `controlImages[${i}].strength must be a number between 0 and 2` },
          { status: 400 },
        );
      }
    }

    // Guard: flux-controlnet does not support pose
    if (model === 'flux-controlnet') {
      const hasPose = controlImages.some((ci: ControlImage) => ci.type === 'pose');
      if (hasPose) {
        return NextResponse.json(
          { error: 'flux-controlnet does not support pose control type. Use controlnet-union-pro or sdxl-multi-controlnet instead.' },
          { status: 400 },
        );
      }
    }

    if (seed !== undefined && (typeof seed !== 'number' || seed < 0)) {
      return NextResponse.json(
        { error: 'seed must be a non-negative number' },
        { status: 400 },
      );
    }

    if (loraUrl) {
      const loraCheck = validateUrl(loraUrl);
      if (!loraCheck.valid) {
        return NextResponse.json(
          { error: `Invalid loraUrl: ${loraCheck.error}` },
          { status: 400 },
        );
      }
    }

    if (anchorImage) {
      const anchorCheck = validateUrl(anchorImage, { allowDataUri: true });
      if (!anchorCheck.valid) {
        return NextResponse.json(
          { error: `Invalid anchorImage: ${anchorCheck.error}` },
          { status: 400 },
        );
      }
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const replicateModel = MODEL_MAP[model];
    const input: Record<string, unknown> = { prompt };

    if (aspectRatio) input.aspect_ratio = aspectRatio;
    if (seed !== undefined) input.seed = seed;

    // Build model-specific inputs
    if (model === 'flux-depth-pro' || model === 'flux-canny-pro') {
      // Single control image models
      input.control_image = controlImages[0].url;
      if (controlImages[0].strength !== undefined) {
        input.control_strength = controlImages[0].strength;
      }
    } else if (model === 'controlnet-union-pro') {
      // Union model supports multiple control types
      for (const ci of controlImages as ControlImage[]) {
        input[`${ci.type}_image`] = ci.url;
        input[`${ci.type}_strength`] = ci.strength;
      }
    } else if (model === 'flux-controlnet') {
      // XLabs flux-dev-controlnet
      input.control_image = controlImages[0].url;
      input.controlnet_conditioning_scale = controlImages[0].strength;
      input.control_type = controlImages[0].type;
    } else if (model === 'sdxl-multi-controlnet') {
      // fofr/sdxl-multi-controlnet-lora supports multiple images
      for (let i = 0; i < controlImages.length; i++) {
        const ci = controlImages[i] as ControlImage;
        const idx = i + 1;
        input[`image${idx > 1 ? idx : ''}`] = ci.url;
        input[`condition_type${idx > 1 ? idx : ''}`] = ci.type;
        input[`condition_scale${idx > 1 ? idx : ''}`] = ci.strength;
      }
      if (loraUrl) input.lora_url = loraUrl;
    }

    if (anchorImage) input.image = anchorImage;

    console.log(`[/api/controlnet-gen] model=${model} replicateModel=${replicateModel} controls=${controlImages.length}`);

    const prediction = await replicate.predictions.create({
      model: replicateModel as `${string}/${string}`,
      input,
    });

    console.log(`[/api/controlnet-gen] prediction=${prediction.id} status=${prediction.status}`);
    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ControlNet generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/controlnet-gen] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
