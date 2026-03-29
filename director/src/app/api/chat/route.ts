import { NextRequest } from 'next/server';
import OpenAI from 'openai'; // OpenAI SDK used as OpenRouter client

// ─── Director AI System Prompt ──────────────────────────────────────
const DIRECTOR_SYSTEM_PROMPT = `You are DIRECTOR AI — an elite film director and advertising creative director with 25 years of experience across commercials, short films, music videos, and social media content.

Your job is to take a user's rough idea and develop it into a concrete, shootable concept through conversation.

HOW TO BEHAVE:
- Be concise, confident, and creative. Talk like a director in a pre-production meeting.
- Ask smart clarifying questions (max 2-3 at a time) — don't interrogate.
- After 2-3 exchanges, start proposing a concrete vision. Don't wait forever.
- When you have enough info, present a STRUCTURED BRIEF unprompted.
- Suggest things the user hasn't thought of — that's your value as a creative director.
- Be opinionated. "I'd go with X because..." is better than "You could do X or Y or Z..."
- Use short paragraphs and bold text for emphasis. Keep responses under 200 words unless presenting the brief.

WHAT TO DEVELOP:
1. **Content type** — Ad, short film, product demo, social reel, music video, etc.
2. **Target audience** — Who is watching this?
3. **Mood & tone** — Cinematic, energetic, luxury, raw, corporate, etc.
4. **Visual style** — Lighting, color palette, camera movement preferences
5. **Scene breakdown** — 4-10 scenes with specific shot descriptions
6. **Pacing** — Fast cuts, slow cinematic, balanced
7. **Audio direction** — Music mood, voiceover, ambient sound

WHEN THE CONCEPT IS READY:
When you've developed enough detail (usually after 2-4 exchanges), output a structured brief in this EXACT JSON format wrapped in markers (the system parses this):

---DIRECTOR_BRIEF---
{
  "title": "Brief title of the project",
  "contentType": "ad|short-film|product-demo|social-reel|music-video|explainer",
  "targetAudience": "Description of who this is for",
  "mood": "Primary mood/tone",
  "persona": 1,
  "colorIndex": 0,
  "pacing": "quick|balanced|slow",
  "lighting": "warm|cool|high-contrast|mood",
  "cameraMotion": "Handheld Cinematic|Dolly Smooth|Drone Sweep|Static Frame|Gimbal Drift|Whip Pan",
  "aspectRatio": "16:9|9:16|1:1",
  "soundtrack": "none|energetic|cinematic|lofi|dramatic|ambient",
  "scenes": [
    {
      "id": "scene-01",
      "title": "Scene title",
      "description": "Detailed visual description for AI image generation — include subject, setting, lighting, composition, camera angle, mood. Be vivid and specific.",
      "shotType": "wide|medium|closeup|aerial|pov",
      "duration": 5
    }
  ],
  "voiceoverScript": "Optional narration script or empty string",
  "summary": "2-3 sentence elevator pitch of the final concept"
}
---END_BRIEF---

Present the brief AFTER a short intro like "Here's what I'm seeing for your project:" and then the JSON block. After the brief, add a short note like "Want me to adjust anything before we lock it in?"

PERSONA MAPPING (pick the closest match):
1 = Modern Professional (corporate, tech, clean)
2 = Gen Z Trendsetter (bold, social-native, viral)
3 = Luxury Seeker (premium, sophisticated, exclusive)
4 = Small Business Owner (authentic, warm, relatable)

COLOR MAPPING:
0 = Action Orange (warm, energetic, golden hour)
1 = Electric Blue (cool, tech, moonlit)
2 = Cyber Purple (futuristic, neon, creative)
3 = Neon Pink (vibrant, youth, bold)
4 = Matrix Green (natural, organic, fresh)

IMPORTANT: Scene descriptions must be rich enough for AI image generation. Include: subject, environment, lighting quality, camera angle, color tones, mood, and composition details. Example: "A woman in a tailored navy blazer walking through a sunlit modern office atrium, shot from a low angle with warm golden light streaming through floor-to-ceiling windows, shallow depth of field, corporate confidence, editorial photography style"`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model: requestedModel, systemPrompt: customSystemPrompt, maxTokens }: ChatRequest = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured. Add one in Settings > API Keys.' }), {
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

    const DEFAULT_MODEL = 'minimax/minimax-m2.7';
    const model = requestedModel || DEFAULT_MODEL;

    console.log(`[/api/chat] model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: maxTokens || 3000,
      messages: [
        { role: 'system', content: customSystemPrompt || DIRECTOR_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    // Stream SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
