import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';
import { IMAGE_MODELS } from '@/lib/models';

const VALID_IMAGE_MODEL_IDS = new Set(IMAGE_MODELS.map(m => m.id));
const VALID_ASPECT_RATIOS = new Set(['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3']);
const MAX_PROMPT_LENGTH = 10000;
const MAX_REFERENCE_IMAGES = 7;

export async function POST(req: NextRequest) {
  let imageModelId: string | undefined;
  try {
    const body = await req.json();
    const { prompt, loraUrl, model, aspectRatio, seed, referenceImages, conditioningWeights, negativePrompt } = body;
    imageModelId = body.imageModelId;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required and must be a string' }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: `prompt exceeds ${MAX_PROMPT_LENGTH} character limit` }, { status: 400 });
    }
    if (imageModelId && !VALID_IMAGE_MODEL_IDS.has(imageModelId)) {
      return NextResponse.json({ error: `Unknown imageModelId: ${imageModelId}` }, { status: 400 });
    }
    if (aspectRatio && !VALID_ASPECT_RATIOS.has(aspectRatio)) {
      return NextResponse.json({ error: `Invalid aspectRatio: ${aspectRatio}` }, { status: 400 });
    }
    if (seed !== undefined && (typeof seed !== 'number' || seed < 0)) {
      return NextResponse.json({ error: 'seed must be a non-negative number' }, { status: 400 });
    }
    if (referenceImages && (!Array.isArray(referenceImages) || referenceImages.length > MAX_REFERENCE_IMAGES)) {
      return NextResponse.json({ error: `referenceImages must be an array of at most ${MAX_REFERENCE_IMAGES} items` }, { status: 400 });
    }

    // Validate user-supplied URLs
    if (loraUrl) {
      const loraCheck = validateUrl(loraUrl);
      if (!loraCheck.valid) {
        return NextResponse.json({ error: `Invalid loraUrl: ${loraCheck.error}` }, { status: 400 });
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

    const result = await generateImage({
      prompt,
      loraUrl,
      imageModelId,
      model: model ?? 'schnell',
      aspectRatio,
      seed,
      referenceImages,
      conditioningWeights,
      negativePrompt,
    });

    return NextResponse.json({ predictionId: result.id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/generate] Error: ${message} | imageModelId: ${imageModelId}\n${stack}`);
    return NextResponse.json({ error: `${message} (model: ${imageModelId || 'default'})` }, { status: 500 });
  }
}
