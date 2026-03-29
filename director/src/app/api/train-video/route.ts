import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { startVideoTraining } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zipUrl, triggerWord, steps, learningRate, targetModel, password } = body;

    // Password gate — video LoRA training is locked
    const expectedPassword = process.env.VIDEO_LORA_PASSWORD;
    if (!expectedPassword || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Authorization required' }, { status: 403 });
    }
    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(expectedPassword, 'utf-8');
    const received = Buffer.from(password, 'utf-8');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 403 });
    }

    if (!zipUrl || !triggerWord) {
      return NextResponse.json({ error: 'zipUrl and triggerWord are required' }, { status: 400 });
    }

    if (!targetModel || !['cogvideox-5b', 'hunyuan-video'].includes(targetModel)) {
      return NextResponse.json({ error: 'targetModel must be cogvideox-5b or hunyuan-video' }, { status: 400 });
    }

    if (typeof triggerWord !== 'string' || triggerWord.length > 100) {
      return NextResponse.json({ error: 'triggerWord must be a string under 100 characters' }, { status: 400 });
    }
    if (steps !== undefined && (typeof steps !== 'number' || steps < 100 || steps > 10000)) {
      return NextResponse.json({ error: 'steps must be between 100 and 10000' }, { status: 400 });
    }
    if (learningRate !== undefined && (typeof learningRate !== 'number' || learningRate <= 0 || learningRate > 0.01)) {
      return NextResponse.json({ error: 'learningRate must be between 0 and 0.01' }, { status: 400 });
    }

    const urlCheck = validateUrl(zipUrl);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: `Invalid zipUrl: ${urlCheck.error}` }, { status: 400 });
    }

    const result = await startVideoTraining({
      inputZipUrl: zipUrl,
      triggerWord,
      steps,
      learningRate,
      targetModel,
    });

    return NextResponse.json({ trainingId: result.id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video training failed to start';
    console.error('[/api/train-video] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
