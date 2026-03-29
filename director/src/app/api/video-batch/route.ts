import { NextRequest, NextResponse } from 'next/server';
import { generateMultiPromptVideo } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';

/**
 * POST /api/video-batch
 *
 * Generates multiple connected video shots in a single Kling 3.0 multi_prompt request.
 * The model generates all shots as one coherent sequence, maintaining visual consistency
 * across characters, environments, lighting, and style.
 *
 * Returns a SINGLE prediction ID — the output is one concatenated video.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { segments, referenceImages, startImageUrl, aspectRatio, generateAudio } = body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'segments array is required' }, { status: 400 });
    }

    if (segments.length > 6) {
      return NextResponse.json({ error: 'multi_prompt supports max 6 segments' }, { status: 400 });
    }

    const totalDuration = segments.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
    if (totalDuration > 15) {
      return NextResponse.json({ error: `Total duration ${totalDuration}s exceeds 15s limit` }, { status: 400 });
    }

    // Validate user-supplied URLs
    if (startImageUrl) {
      const startCheck = validateUrl(startImageUrl, { allowDataUri: true });
      if (!startCheck.valid) {
        return NextResponse.json({ error: `Invalid startImageUrl: ${startCheck.error}` }, { status: 400 });
      }
    }
    if (referenceImages && Array.isArray(referenceImages)) {
      for (let i = 0; i < referenceImages.length; i++) {
        const refCheck = validateUrl(referenceImages[i], { allowDataUri: true });
        if (!refCheck.valid) {
          return NextResponse.json({ error: `Invalid referenceImage[${i}]: ${refCheck.error}` }, { status: 400 });
        }
      }
    }

    console.log(`[/api/video-batch] segments=${segments.length} totalDuration=${totalDuration}s refs=${referenceImages?.length ?? 0}`);
    for (let i = 0; i < segments.length; i++) {
      console.log(`  segment[${i}]: duration=${segments[i].duration}s prompt=${segments[i].prompt?.slice(0, 60)}...`);
    }

    const result = await generateMultiPromptVideo({
      segments: segments.map((s: { prompt: string; duration: number }) => ({
        prompt: s.prompt,
        duration: s.duration,
      })),
      referenceImages,
      startImageUrl,
      aspectRatio,
      generateAudio,
    });

    console.log(`[/api/video-batch] prediction=${result.id} status=${result.status}`);
    return NextResponse.json({
      predictionId: result.id,
      status: result.status,
      segmentCount: segments.length,
      totalDuration,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Multi-prompt video generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/video-batch] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
