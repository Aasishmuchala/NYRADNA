import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/lib/replicate';
import { validateUrl } from '@/lib/urlValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, maskUrl, prompt } = body;

    if (!imageUrl || !maskUrl || !prompt) {
      return NextResponse.json({ error: 'imageUrl, maskUrl, and prompt are required' }, { status: 400 });
    }

    if (typeof prompt !== 'string' || prompt.length > 10000) {
      return NextResponse.json({ error: 'prompt must be a string under 10000 characters' }, { status: 400 });
    }

    const imageCheck = validateUrl(imageUrl, { allowDataUri: true });
    if (!imageCheck.valid) {
      return NextResponse.json({ error: `Invalid imageUrl: ${imageCheck.error}` }, { status: 400 });
    }
    const maskCheck = validateUrl(maskUrl, { allowDataUri: true });
    if (!maskCheck.valid) {
      return NextResponse.json({ error: `Invalid maskUrl: ${maskCheck.error}` }, { status: 400 });
    }

    const result = await editImage(imageUrl, maskUrl, prompt);

    return NextResponse.json({ predictionId: result.id, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image editing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
