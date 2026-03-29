import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

function getClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }
  return new Replicate({ auth: token });
}

const TTS_MODEL = 'lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e';

interface VoiceoverRequest {
  script: string;
  voice?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VoiceoverRequest = await req.json();
    const { script, voice } = body;

    if (!script || script.trim().length === 0) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 });
    }

    if (script.length > 5000) {
      return NextResponse.json({ error: 'script must be under 5000 characters' }, { status: 400 });
    }

    const replicate = getClient();

    // Create the TTS prediction
    const prediction = await replicate.predictions.create({
      version: TTS_MODEL.split(':')[1],
      input: {
        text: script.trim(),
        language: 'en',
        ...(voice ? { speaker: voice } : {}),
      },
    });

    // Poll for completion
    let result = prediction;
    const maxAttempts = 120; // 2 minutes with 1s intervals
    let attempts = 0;

    while (
      result.status !== 'succeeded' &&
      result.status !== 'failed' &&
      result.status !== 'canceled' &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await replicate.predictions.get(result.id);
      attempts++;
    }

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error ? String(result.error) : 'Voiceover generation failed' },
        { status: 500 },
      );
    }

    if (result.status === 'canceled') {
      return NextResponse.json({ error: 'Voiceover generation was canceled' }, { status: 500 });
    }

    if (result.status !== 'succeeded' || !result.output) {
      return NextResponse.json({ error: 'Voiceover generation timed out' }, { status: 504 });
    }

    // Output is typically a URL string or an object with a URL
    const audioUrl = typeof result.output === 'string'
      ? result.output
      : Array.isArray(result.output)
        ? result.output[0]
        : String(result.output);

    // Estimate duration: average ~150 words per minute for narration
    const wordCount = script.trim().split(/\s+/).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / 150) * 60));

    return NextResponse.json({ audioUrl, durationSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Voiceover generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
