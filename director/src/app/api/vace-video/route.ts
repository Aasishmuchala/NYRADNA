import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const MAX_PROMPT_LENGTH = 10000;
const MAX_REFERENCE_IMAGES = 4;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, referenceImages, sourceVideo, guidanceScale, seed } = body;

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

    if (referenceImages) {
      if (!Array.isArray(referenceImages) || referenceImages.length > MAX_REFERENCE_IMAGES) {
        return NextResponse.json(
          { error: `referenceImages must be an array of at most ${MAX_REFERENCE_IMAGES} items` },
          { status: 400 },
        );
      }
      for (let i = 0; i < referenceImages.length; i++) {
        const urlCheck = validateUrl(referenceImages[i], { allowDataUri: true });
        if (!urlCheck.valid) {
          return NextResponse.json(
            { error: `Invalid referenceImages[${i}]: ${urlCheck.error}` },
            { status: 400 },
          );
        }
      }
    }

    if (sourceVideo) {
      const videoCheck = validateUrl(sourceVideo, { allowDataUri: true });
      if (!videoCheck.valid) {
        return NextResponse.json(
          { error: `Invalid sourceVideo: ${videoCheck.error}` },
          { status: 400 },
        );
      }
    }

    if (guidanceScale !== undefined && (typeof guidanceScale !== 'number' || guidanceScale < 1 || guidanceScale > 20)) {
      return NextResponse.json(
        { error: 'guidanceScale must be a number between 1 and 20' },
        { status: 400 },
      );
    }

    if (seed !== undefined && (typeof seed !== 'number' || seed < 0)) {
      return NextResponse.json(
        { error: 'seed must be a non-negative number' },
        { status: 400 },
      );
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const input: Record<string, unknown> = {
      prompt,
    };

    if (referenceImages?.length) input.reference_images = referenceImages;
    if (sourceVideo) input.source_video = sourceVideo;
    if (guidanceScale !== undefined) input.guidance_scale = guidanceScale;
    if (seed !== undefined) input.seed = seed;

    const prediction = await replicate.predictions.create({
      model: 'prunaai/vace-14b' as `${string}/${string}`,
      input,
    });

    console.log(`[/api/vace-video] prediction=${prediction.id} status=${prediction.status} refs=${referenceImages?.length ?? 0}`);
    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'VACE video generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/vace-video] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
