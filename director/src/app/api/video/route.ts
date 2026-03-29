import { NextRequest, NextResponse } from 'next/server';
import { generateVideo } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';
import { VIDEO_MODELS } from '@/lib/models';

const VALID_VIDEO_MODEL_IDS = new Set(VIDEO_MODELS.map(m => m.id));
const MAX_PROMPT_LENGTH = 10000;
const MAX_REFERENCE_IMAGES = 7;
const MAX_DURATION = 15;

export async function POST(req: NextRequest) {
  let videoModelId: string | undefined;
  try {
    const body = await req.json();
    ({ videoModelId } = body);
    const { imageUrl, prompt, duration, mode, aspectRatio, referenceImages, generateAudio } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }
    if (prompt && typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt must be a string' }, { status: 400 });
    }
    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: `prompt exceeds ${MAX_PROMPT_LENGTH} character limit` }, { status: 400 });
    }
    if (videoModelId && !VALID_VIDEO_MODEL_IDS.has(videoModelId)) {
      return NextResponse.json({ error: `Unknown videoModelId: ${videoModelId}` }, { status: 400 });
    }
    if (duration !== undefined && (typeof duration !== 'number' || duration < 1 || duration > MAX_DURATION)) {
      return NextResponse.json({ error: `duration must be between 1 and ${MAX_DURATION}` }, { status: 400 });
    }
    if (referenceImages && (!Array.isArray(referenceImages) || referenceImages.length > MAX_REFERENCE_IMAGES)) {
      return NextResponse.json({ error: `referenceImages must be an array of at most ${MAX_REFERENCE_IMAGES} items` }, { status: 400 });
    }

    // Validate user-supplied URLs
    const imageCheck = validateUrl(imageUrl, { allowDataUri: true });
    if (!imageCheck.valid) {
      return NextResponse.json({ error: `Invalid imageUrl: ${imageCheck.error}` }, { status: 400 });
    }
    if (referenceImages && Array.isArray(referenceImages)) {
      for (let i = 0; i < referenceImages.length; i++) {
        const refCheck = validateUrl(referenceImages[i], { allowDataUri: true });
        if (!refCheck.valid) {
          return NextResponse.json({ error: `Invalid referenceImage[${i}]: ${refCheck.error}` }, { status: 400 });
        }
      }
    }

    console.log(`[/api/video] model=${videoModelId} prompt=${prompt?.slice(0, 60)} refs=${referenceImages?.length ?? 0} audio=${generateAudio}`);

    const result = await generateVideo({
      imageUrl,
      prompt,
      duration,
      mode,
      aspectRatio,
      referenceImages,
      generateAudio,
      videoModelId,
    });

    console.log(`[/api/video] prediction=${result.id} status=${result.status}`);
    return NextResponse.json({ predictionId: result.id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/video] Error: ${message} | model: ${videoModelId}\n${stack}`);
    return NextResponse.json({ error: `${message} (model: ${videoModelId || 'default'})` }, { status: 500 });
  }
}
