import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai'; // OpenAI SDK used as OpenRouter client

const SYSTEM_PROMPT = `You are a cinematic persona designer for an AI video production engine called DIRECTOR.

Given a short description of a target audience, generate a complete persona profile in JSON format:

{
  "title": "Short name (2-3 words)",
  "description": "One-line tagline about this persona",
  "feedDescription": "2-3 sentence recommendation for visual style, pacing, transitions, and soundtrack matching this audience",
  "tone": "Cinematic prompt tokens for this persona: framing style, color approach, composition keywords (comma-separated)",
  "atmosphere": "Ambient sound/music keywords for video audio (comma-separated)"
}

Examples of tone: "warm authentic feel, natural skin tones, relatable candid framing"
Examples of atmosphere: "upbeat electronic music, city sounds, energetic crowd"

Be specific and cinematic. Return ONLY valid JSON, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { description: string; model?: string };
    const { description, model } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 401 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://director.ai',
        'X-Title': 'Director AI',
      },
    });

    const completion = await client.chat.completions.create({
      model: model || 'minimax/minimax-m2.7', // fallback matches DEFAULT_LLM_MODEL
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    const persona = JSON.parse(text);

    return NextResponse.json(persona);
  } catch (err) {
    console.error('Persona generation error:', err);
    return NextResponse.json({ error: 'Failed to generate persona' }, { status: 500 });
  }
}
