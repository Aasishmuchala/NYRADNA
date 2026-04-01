import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const MODEL_MAP: Record<string, string> = {
  'pulid-flux': 'bytedance/flux-pulid',
  'ip-adapter-faceid': 'zsxkib/ip-adapter-faceid',
};

const VALID_MODELS = new Set(Object.keys(MODEL_MAP));
const MAX_PROMPT_LENGTH = 10000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { faceImage, prompt, idWeight, seed, model } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    if (!faceImage || typeof faceImage !== 'string') {
      return NextResponse.json(
        { error: 'faceImage is required and must be a string' },
        { status: 400 },
      );
    }

    const faceCheck = validateUrl(faceImage, { allowDataUri: true });
    if (!faceCheck.valid) {
      return NextResponse.json(
        { error: `Invalid faceImage: ${faceCheck.error}` },
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

    if (!model || !VALID_MODELS.has(model)) {
      return NextResponse.json(
        { error: `model is required and must be one of: ${[...VALID_MODELS].join(', ')}` },
        { status: 400 },
      );
    }

    if (idWeight !== undefined && (typeof idWeight !== 'number' || idWeight < 0 || idWeight > 2)) {
      return NextResponse.json(
        { error: 'idWeight must be a number between 0 and 2' },
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

    const replicateModel = MODEL_MAP[model];
    const input: Record<string, unknown> = { prompt };

    if (model === 'pulid-flux') {
      input.main_face_image = faceImage;
      if (idWeight !== undefined) input.id_weight = idWeight;
    } else if (model === 'ip-adapter-faceid') {
      input.face_image = faceImage;
      if (idWeight !== undefined) input.ip_adapter_weight = idWeight;
    }

    if (seed !== undefined) input.seed = seed;

    console.log(`[/api/identity-lock] model=${model} replicateModel=${replicateModel}`);

    const prediction = await replicate.predictions.create({
      model: replicateModel as `${string}/${string}`,
      input,
    });

    console.log(`[/api/identity-lock] prediction=${prediction.id} status=${prediction.status}`);
    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Identity lock generation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/identity-lock] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
