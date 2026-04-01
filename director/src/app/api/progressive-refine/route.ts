import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const MAX_PROMPT_LENGTH = 10000;
const MAX_STAGES = 5;

interface RefinementStage {
  model: string;
  controlType: string;
  strength: number;
  prompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseImage, controlImage, prompt, heroImage, stages } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    if (!baseImage || typeof baseImage !== 'string') {
      return NextResponse.json(
        { error: 'baseImage is required and must be a string' },
        { status: 400 },
      );
    }
    const baseCheck = validateUrl(baseImage, { allowDataUri: true });
    if (!baseCheck.valid) {
      return NextResponse.json(
        { error: `Invalid baseImage: ${baseCheck.error}` },
        { status: 400 },
      );
    }

    if (!controlImage || typeof controlImage !== 'string') {
      return NextResponse.json(
        { error: 'controlImage is required and must be a string' },
        { status: 400 },
      );
    }
    const controlCheck = validateUrl(controlImage, { allowDataUri: true });
    if (!controlCheck.valid) {
      return NextResponse.json(
        { error: `Invalid controlImage: ${controlCheck.error}` },
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

    if (heroImage) {
      const heroCheck = validateUrl(heroImage, { allowDataUri: true });
      if (!heroCheck.valid) {
        return NextResponse.json(
          { error: `Invalid heroImage: ${heroCheck.error}` },
          { status: 400 },
        );
      }
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: 'stages is required and must be a non-empty array' },
        { status: 400 },
      );
    }
    if (stages.length > MAX_STAGES) {
      return NextResponse.json(
        { error: `stages must have at most ${MAX_STAGES} items` },
        { status: 400 },
      );
    }

    // Validate each stage
    const validModels = new Set([
      'flux-depth-pro', 'flux-canny-pro', 'controlnet-union-pro',
      'flux-controlnet', 'sdxl-multi-controlnet',
    ]);
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i] as RefinementStage;
      if (!stage.model || !validModels.has(stage.model)) {
        return NextResponse.json(
          { error: `stages[${i}].model must be one of: ${[...validModels].join(', ')}` },
          { status: 400 },
        );
      }
      if (!stage.controlType || typeof stage.controlType !== 'string') {
        return NextResponse.json(
          { error: `stages[${i}].controlType is required` },
          { status: 400 },
        );
      }
      if (typeof stage.strength !== 'number' || stage.strength < 0 || stage.strength > 2) {
        return NextResponse.json(
          { error: `stages[${i}].strength must be a number between 0 and 2` },
          { status: 400 },
        );
      }
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Model routing map (same as controlnet-gen)
    const modelMap: Record<string, string> = {
      'flux-depth-pro': 'black-forest-labs/flux-depth-pro',
      'flux-canny-pro': 'black-forest-labs/flux-canny-pro',
      'controlnet-union-pro': 'lucataco/controlnet-union-pro',
      'flux-controlnet': 'xlabs-ai/flux-dev-controlnet',
      'sdxl-multi-controlnet': 'fofr/sdxl-multi-controlnet-lora',
    };

    // Execute first stage to get prediction started
    // Subsequent stages would chain via webhook/polling in production
    const firstStage = stages[0] as RefinementStage;
    const replicateModel = modelMap[firstStage.model];

    const input: Record<string, unknown> = {
      prompt: firstStage.prompt || prompt,
      control_image: controlImage,
    };

    // Set the base/anchor image
    if (heroImage) {
      input.image = heroImage;
    } else {
      input.image = baseImage;
    }

    // Model-specific control params
    if (firstStage.model === 'flux-depth-pro' || firstStage.model === 'flux-canny-pro') {
      input.control_strength = firstStage.strength;
    } else if (firstStage.model === 'flux-controlnet') {
      input.controlnet_conditioning_scale = firstStage.strength;
      input.control_type = firstStage.controlType;
    } else if (firstStage.model === 'controlnet-union-pro') {
      input[`${firstStage.controlType}_image`] = controlImage;
      input[`${firstStage.controlType}_strength`] = firstStage.strength;
      delete input.control_image;
    } else if (firstStage.model === 'sdxl-multi-controlnet') {
      input.image = controlImage;
      input.condition_type = firstStage.controlType;
      input.condition_scale = firstStage.strength;
      delete input.control_image;
    }

    console.log(`[/api/progressive-refine] stages=${stages.length} firstModel=${firstStage.model} replicateModel=${replicateModel}`);

    const prediction = await replicate.predictions.create({
      model: replicateModel as `${string}/${string}`,
      input,
    });

    // For multi-stage: in production, subsequent stages would be triggered via
    // a webhook or polling loop. For now, return the first stage's prediction ID.
    // The client can poll /api/status and then call progressive-refine again
    // with the output as the new baseImage for the next stage.

    console.log(`[/api/progressive-refine] prediction=${prediction.id} status=${prediction.status}`);
    return NextResponse.json({
      predictionId: prediction.id,
      finalImage: null,
      qualityScores: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Progressive refinement failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/progressive-refine] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
