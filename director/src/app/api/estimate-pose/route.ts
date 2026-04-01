import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, threshold } = body;

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

    if (threshold !== undefined && (typeof threshold !== 'number' || threshold < 0 || threshold > 1)) {
      return NextResponse.json(
        { error: 'threshold must be a number between 0 and 1' },
        { status: 400 },
      );
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const input: Record<string, unknown> = {
      image: imageUrl,
    };
    if (threshold !== undefined) {
      input.threshold = threshold;
    }

    const prediction = await replicate.predictions.create({
      model: 'jagilley/dwpose' as `${string}/${string}`,
      input,
    });

    console.log(`[/api/estimate-pose] prediction=${prediction.id} status=${prediction.status}`);
    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pose estimation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/estimate-pose] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
