import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { validateUrl } from '@/lib/urlValidation';

/**
 * Analyzes an image using a vision model via OpenRouter.
 * Returns cinematic metadata: emotion, camera, lighting, composition quality, etc.
 */

const VISION_MODEL = 'google/gemini-2.5-flash';

const ANALYSIS_PROMPT = `You are a cinematic image analyst. Analyze this image and return a JSON object with these fields:

{
  "emotion": one of "calm"|"curious"|"tense"|"intense"|"triumphant"|"reflective"|"energetic"|"mysterious",
  "camera": one of "wide"|"medium"|"close"|"extreme-close"|"aerial",
  "lighting": one of "soft"|"hard"|"natural"|"dramatic"|"neutral",
  "composition_quality": 0.0 to 1.0 (how well composed the shot is),
  "character_consistency": 0.0 to 1.0 (how realistic/consistent the subject looks, 1.0 = photorealistic),
  "pose": one of "still"|"action"|"candid"|"posed"|"dynamic",
  "color_temperature": one of "warm"|"cool"|"neutral",
  "depth_of_field": one of "shallow"|"deep"|"flat",
  "narrative_strength": 0.0 to 1.0 (how much story this image tells on its own),
  "scene_type": one of "establishing"|"portrait"|"action"|"detail"|"environment"|"product"|"emotional",
  "brief_description": "one sentence describing what's in the image cinematically"
}

Return ONLY the JSON object, no markdown, no explanation.`;

export interface SceneAnalysis {
  emotion: string;
  camera: string;
  lighting: string;
  composition_quality: number;
  character_consistency: number;
  pose: string;
  color_temperature: string;
  depth_of_field: string;
  narrative_strength: number;
  scene_type: string;
  brief_description: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, model: requestedModel } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const urlCheck = validateUrl(imageUrl, { allowDataUri: true });
    if (!urlCheck.valid) {
      return new Response(JSON.stringify({ error: `Invalid imageUrl: ${urlCheck.error}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://director.ai',
        'X-Title': 'Director AI',
      },
    });

    const model = requestedModel || VISION_MODEL;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: SceneAnalysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scene analysis failed';
    console.error(`[/api/analyze-scene] ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
