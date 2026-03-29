import { NextRequest, NextResponse } from 'next/server';
import { startTraining } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zipUrl, triggerWord, steps, learningRate } = body;

    if (!zipUrl || !triggerWord) {
      return NextResponse.json({ error: 'zipUrl and triggerWord are required' }, { status: 400 });
    }

    if (typeof triggerWord !== 'string' || triggerWord.length > 100) {
      return NextResponse.json({ error: 'triggerWord must be a string under 100 characters' }, { status: 400 });
    }
    if (steps !== undefined && (typeof steps !== 'number' || steps < 1 || steps > 10000)) {
      return NextResponse.json({ error: 'steps must be between 1 and 10000' }, { status: 400 });
    }
    if (learningRate !== undefined && (typeof learningRate !== 'number' || learningRate <= 0 || learningRate > 1)) {
      return NextResponse.json({ error: 'learningRate must be between 0 and 1' }, { status: 400 });
    }

    const urlCheck = validateUrl(zipUrl);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: `Invalid zipUrl: ${urlCheck.error}` }, { status: 400 });
    }

    const result = await startTraining({
      inputZipUrl: zipUrl,
      triggerWord,
      steps,
      learningRate,
    });

    return NextResponse.json({ trainingId: result.id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Training failed to start';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
