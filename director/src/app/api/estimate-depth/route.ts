import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const VALID_ENCODER_SIZES = new Set(['vits', 'vitb', 'vitl']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, encoderSize } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageUrl is required and must be a string' },
        { status: 400 },
      );
    }

    const urlCheck = validateUrl(imageUrl, { allowDataUri: true });
    if (!urlCheck.valid) {
      return NextResponse.json(
        { error: `Invalid imageUrl: ${urlCheck.error}` },
        { status: 400 },
      );
    }

    if (encoderSize && !VALID_ENCODER_SIZES.has(encoderSize)) {
      return NextResponse.json(
        { error: `Invalid encoderSize: ${encoderSize}. Must be one of: ${[...VALID_ENCODER_SIZES].join(', ')}` },
        { status: 400 },
      );
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const prediction = await replicate.predictions.create({
      model: 'chenxwh/depth-anything-v2' as `${string}/${string}`,
      input: {
        image: imageUrl,
        encoder_size: encoderSize || 'vitb',
      },
    });

    console.log(`[/api/estimate-depth] prediction=${prediction.id} status=${prediction.status}`);
    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Depth estimation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/estimate-depth] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
