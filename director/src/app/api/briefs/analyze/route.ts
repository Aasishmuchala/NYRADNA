import { NextRequest, NextResponse } from 'next/server';
import type { DirectorsBrief } from '@/lib/types/directors-brief';
import type { SequencePlan, SequenceSegment } from '@/lib/types/sequence-plan';

/**
 * Generate a deterministic mock SequencePlan from the brief data.
 * Used when OPENAI_API_KEY is not set (default development mode).
 */
function generateMockSequencePlan(brief: DirectorsBrief): SequencePlan {
  const segments: SequenceSegment[] =
    brief.narrativeBeats.beats.length > 0
      ? brief.narrativeBeats.beats.map((beat, i) => ({
          index: i,
          title: beat.label || `Segment ${i + 1}`,
          visualDescription: `${brief.visualStyle.mood || 'cinematic'} scene: ${beat.emotion || 'dramatic'} moment`,
          emotionalTone: beat.emotion || 'neutral',
          transitionFromPrevious: i === 0 ? null : beat.transition || 'cut',
          durationHint: '3-5 seconds',
        }))
      : [
          {
            index: 0,
            title: 'Opening',
            visualDescription: `${brief.visualStyle.mood || 'cinematic'} establishing shot`,
            emotionalTone: 'anticipation',
            transitionFromPrevious: null,
            durationHint: '3-5 seconds',
          },
          {
            index: 1,
            title: 'Development',
            visualDescription: `${brief.storyline.theme || 'narrative'} exploration`,
            emotionalTone: 'engagement',
            transitionFromPrevious: 'dissolve',
            durationHint: '5-8 seconds',
          },
          {
            index: 2,
            title: 'Resolution',
            visualDescription: `${brief.storyline.theme || 'narrative'} payoff`,
            emotionalTone: 'satisfaction',
            transitionFromPrevious: 'fade',
            durationHint: '3-5 seconds',
          },
        ];

  return {
    id: crypto.randomUUID(),
    briefId: brief.id,
    segments,
    overallArc: `A ${brief.visualStyle.mood || 'cinematic'} narrative exploring ${brief.storyline.theme || 'the unknown'}`,
    estimatedTotalDuration: `${segments.length * 4}-${segments.length * 6} seconds`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Call OpenAI API to generate a SequencePlan from the brief.
 * Uses direct fetch (no SDK dependency needed).
 */
async function generateAISequencePlan(brief: DirectorsBrief): Promise<SequencePlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const systemPrompt = `You are a Creative Director for AI video production. Given a Director's Brief, produce a SequencePlan that maps the narrative vision to concrete video segments. Return ONLY valid JSON matching this schema:
{
  "segments": [{ "index": number, "title": string, "visualDescription": string, "emotionalTone": string, "transitionFromPrevious": string | null, "durationHint": string }],
  "overallArc": string,
  "estimatedTotalDuration": string
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(brief) },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);

  return {
    id: crypto.randomUUID(),
    briefId: brief.id,
    segments: parsed.segments,
    overallArc: parsed.overallArc,
    estimatedTotalDuration: parsed.estimatedTotalDuration,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brief = body.brief as DirectorsBrief;

    if (!brief || !brief.storyline || !brief.visualStyle || !brief.narrativeBeats) {
      return NextResponse.json(
        { error: 'Valid DirectorsBrief required in request body as { brief }' },
        { status: 400 }
      );
    }

    let sequencePlan: SequencePlan;

    if (process.env.OPENAI_API_KEY) {
      try {
        sequencePlan = await generateAISequencePlan(brief);
      } catch (aiError) {
        console.error('AI analysis failed, falling back to mock:', aiError);
        sequencePlan = generateMockSequencePlan(brief);
      }
    } else {
      sequencePlan = generateMockSequencePlan(brief);
    }

    return NextResponse.json({ sequencePlan }, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
