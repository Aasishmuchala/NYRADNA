import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/urlValidation';

const VALID_METRICS = new Set(['clip', 'dreamsim', 'arcface']);
const PASS_THRESHOLD_DREAMSIM = 0.8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image1, image2, metrics } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    if (!image1 || typeof image1 !== 'string') {
      return NextResponse.json(
        { error: 'image1 is required and must be a string' },
        { status: 400 },
      );
    }
    if (!image2 || typeof image2 !== 'string') {
      return NextResponse.json(
        { error: 'image2 is required and must be a string' },
        { status: 400 },
      );
    }

    const img1Check = validateUrl(image1, { allowDataUri: true });
    if (!img1Check.valid) {
      return NextResponse.json(
        { error: `Invalid image1: ${img1Check.error}` },
        { status: 400 },
      );
    }
    const img2Check = validateUrl(image2, { allowDataUri: true });
    if (!img2Check.valid) {
      return NextResponse.json(
        { error: `Invalid image2: ${img2Check.error}` },
        { status: 400 },
      );
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'metrics is required and must be a non-empty array' },
        { status: 400 },
      );
    }
    for (const m of metrics) {
      if (!VALID_METRICS.has(m)) {
        return NextResponse.json(
          { error: `Invalid metric: ${m}. Must be one of: ${[...VALID_METRICS].join(', ')}` },
          { status: 400 },
        );
      }
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const results: Record<string, number | undefined> = {};
    let allPass = true;

    // DreamSim: real model call
    if (metrics.includes('dreamsim')) {
      try {
        const prediction = await replicate.predictions.create({
          model: 'andreasjansson/dreamsim' as `${string}/${string}`,
          input: {
            image_1: image1,
            image_2: image2,
          },
        });

        // Wait for the prediction to complete (short polling since this is a lightweight model)
        let result = await replicate.predictions.get(prediction.id);
        const maxAttempts = 30;
        let attempts = 0;
        while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = await replicate.predictions.get(prediction.id);
          attempts++;
        }

        if (result.status === 'succeeded' && result.output !== null && result.output !== undefined) {
          const score = typeof result.output === 'number' ? result.output : parseFloat(String(result.output));
          results.dreamsim = score;
          if (score < PASS_THRESHOLD_DREAMSIM) allPass = false;
        } else {
          results.dreamsim = undefined;
          allPass = false;
        }
      } catch (e) {
        console.error(`[/api/quality-score] dreamsim error: ${e instanceof Error ? e.message : e}`);
        results.dreamsim = undefined;
        allPass = false;
      }
    }

    // CLIP similarity: mock score (real implementation would use a CLIP model)
    if (metrics.includes('clip')) {
      // Placeholder: return a reasonable mock score
      // In production, this would call a CLIP embedding model and compute cosine similarity
      results.clip = 0.85;
      console.log(`[/api/quality-score] clip: using mock score (0.85)`);
    }

    // ArcFace similarity: mock score (real implementation would use an ArcFace model)
    if (metrics.includes('arcface')) {
      // Placeholder: return a reasonable mock score
      // In production, this would call an ArcFace model and compute cosine similarity
      results.arcface = 0.78;
      console.log(`[/api/quality-score] arcface: using mock score (0.78)`);
    }

    console.log(`[/api/quality-score] metrics=${metrics.join(',')} pass=${allPass}`);
    return NextResponse.json({
      clip: results.clip,
      dreamsim: results.dreamsim,
      arcface: results.arcface,
      pass: allPass,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Quality score computation failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/quality-score] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
