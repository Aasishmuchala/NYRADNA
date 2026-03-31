const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { PipelineNode } from '@/lib/types/pipeline-node';
import type { PipelineGap } from '@/lib/types/pipeline-gap';

async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // setAll can fail in read-only contexts (e.g., middleware)
            }
          });
        },
      },
    }
  );
}

/**
 * Map snake_case DB row to camelCase PipelineNode
 */
function mapRowToNode(row: Record<string, unknown>): PipelineNode {
  const narrativeContext = (row.narrative_context as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    assetSetId: row.asset_set_id as string,
    assetItemId: row.asset_item_id as string,
    position: row.position as number,
    title: row.title as string,
    description: row.description as string,
    status: row.status as PipelineNode['status'],
    narrativeContext: {
      emotionalTone: (narrativeContext.emotionalTone as string) ?? 'neutral',
      transitionFromPrevious: (narrativeContext.transitionFromPrevious as string) ?? null,
      durationHint: (narrativeContext.durationHint as string) ?? '3-5 seconds',
    },
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    videoUrl: (row.video_url as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Map snake_case DB row to camelCase PipelineGap
 */
function mapRowToGap(row: Record<string, unknown>): PipelineGap {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    assetSetId: row.asset_set_id as string,
    sourceNodeId: row.source_node_id as string,
    targetNodeId: row.target_node_id as string,
    gapType: row.gap_type as PipelineGap['gapType'],
    severity: row.severity as PipelineGap['severity'],
    status: row.status as PipelineGap['status'],
    title: row.title as string,
    description: row.description as string,
    suggestion: row.suggestion as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

interface DetectedGap {
  gapType: 'visual' | 'narrative';
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  description: string;
  suggestion: string;
}

/**
 * Heuristic gap analysis (deterministic mock, default mode when no OPENAI_API_KEY).
 * Analyzes adjacent node pairs for narrative and visual discontinuities.
 */
function analyzeNodePairHeuristic(
  nodeA: PipelineNode,
  nodeB: PipelineNode,
  totalNodes: number,
  pairIndex: number
): DetectedGap[] {
  const gaps: DetectedGap[] = [];
  const toneA = nodeA.narrativeContext.emotionalTone;
  const toneB = nodeB.narrativeContext.emotionalTone;
  const transitionB = nodeB.narrativeContext.transitionFromPrevious;

  // --- Narrative gap detection (GAP-03) ---

  // Abrupt emotional shift with hard cut
  const isHardCut = !transitionB || transitionB === 'cut';
  const isDifferentTone = toneA.toLowerCase() !== toneB.toLowerCase();

  if (isHardCut && isDifferentTone) {
    gaps.push({
      gapType: 'narrative',
      severity: 'moderate',
      title: `Abrupt transition between '${nodeA.title}' and '${nodeB.title}'`,
      description: `Abrupt emotional shift from '${toneA}' to '${toneB}' with hard cut transition`,
      suggestion: `Consider adding a bridge scene with 'dissolve' transition to smooth the emotional shift`,
    });
  }

  // Repetitive emotional tone
  if (!isDifferentTone) {
    gaps.push({
      gapType: 'narrative',
      severity: 'minor',
      title: `Repetitive tone between '${nodeA.title}' and '${nodeB.title}'`,
      description: `Repetitive emotional tone '${toneA}' across consecutive segments may reduce engagement`,
      suggestion: `Consider adding a bridge scene with 'contrast' transition to smooth the emotional shift`,
    });
  }

  // Missing narrative pivot at midpoint
  const midpoint = Math.floor(totalNodes / 2) - 1; // pair index at midpoint
  const transitionKeywords = ['dissolve', 'fade', 'crossfade', 'wipe', 'morph'];
  const hasTransitionKeyword = transitionB
    ? transitionKeywords.some((kw) => transitionB.toLowerCase().includes(kw))
    : false;

  if (pairIndex === midpoint && !hasTransitionKeyword) {
    gaps.push({
      gapType: 'narrative',
      severity: 'critical',
      title: `Missing narrative pivot at sequence midpoint`,
      description: `Missing narrative pivot at sequence midpoint between '${nodeA.title}' and '${nodeB.title}'`,
      suggestion: `Consider adding a bridge scene with 'fade' transition to smooth the emotional shift`,
    });
  }

  // --- Visual gap detection (GAP-02) ---

  const hasThumbA = !!nodeA.thumbnailUrl;
  const hasThumbB = !!nodeB.thumbnailUrl;

  if (hasThumbA !== hasThumbB) {
    // One has thumbnail, the other doesn't
    const missingNode = hasThumbA ? nodeB : nodeA;
    gaps.push({
      gapType: 'visual',
      severity: 'moderate',
      title: `Missing visual reference for '${missingNode.title}'`,
      description: `Visual reference missing for '${missingNode.title}' — cannot assess continuity`,
      suggestion: `Upload a reference image for '${missingNode.title}' to enable visual continuity analysis`,
    });
  } else if (hasThumbA && hasThumbB) {
    // Both have thumbnails but different assets — flag for continuity review
    gaps.push({
      gapType: 'visual',
      severity: 'minor',
      title: `Visual continuity check: '${nodeA.title}' to '${nodeB.title}'`,
      description: `Visual continuity check needed between '${nodeA.title}' and '${nodeB.title}' — different source assets`,
      suggestion: `Review color palette and composition between these segments for consistency`,
    });
  }

  return gaps;
}

/**
 * AI-powered gap analysis using OpenAI API.
 * Falls back to heuristic on failure.
 */
async function analyzeNodesAI(
  nodes: PipelineNode[],
  briefContext: Record<string, unknown>
): Promise<DetectedGap[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const systemPrompt = `You are a film continuity analyst for AI video production. Given a sequence of pipeline nodes (each representing a video segment) and a Director's Brief, analyze adjacent node pairs for narrative and visual gaps.

For each gap found, return a JSON object with:
- gapType: "visual" or "narrative"
- severity: "critical", "moderate", or "minor"
- title: short description of the gap
- description: detailed explanation
- suggestion: recommended fix

Return ONLY a valid JSON array of gap objects. Return [] if no gaps found.

Narrative gaps include: abrupt emotional shifts, missing transitions, repetitive tones, missing story beats.
Visual gaps include: style/color discontinuity, missing references, composition drift.`;

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
        {
          role: 'user',
          content: JSON.stringify({
            nodes: nodes.map((n) => ({
              position: n.position,
              title: n.title,
              description: n.description,
              emotionalTone: n.narrativeContext.emotionalTone,
              transitionFromPrevious: n.narrativeContext.transitionFromPrevious,
              hasThumbnail: !!n.thumbnailUrl,
            })),
            briefContext,
          }),
        },
      ],
      temperature: 0.4,
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
  // Handle both { gaps: [...] } and direct array responses
  const gapsArray = Array.isArray(parsed) ? parsed : (parsed.gaps ?? []);

  return gapsArray.map((g: Record<string, unknown>) => ({
    gapType: g.gapType as 'visual' | 'narrative',
    severity: g.severity as 'critical' | 'moderate' | 'minor',
    title: (g.title as string) || '',
    description: (g.description as string) || '',
    suggestion: (g.suggestion as string) || '',
  }));
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  try {
    const body = await request.json();
    const { projectId, assetSetId } = body;

    if (!projectId || !assetSetId) {
      return NextResponse.json(
        { error: 'projectId and assetSetId required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Step 1: Fetch pipeline nodes for the asset set ordered by position
    const { data: nodeRows, error: nodesError } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('asset_set_id', assetSetId)
      .order('position', { ascending: true });

    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    if (!nodeRows || nodeRows.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 pipeline nodes are required for gap analysis' },
        { status: 400 }
      );
    }

    const nodes = nodeRows.map(mapRowToNode);

    // Step 2: Fetch the Director's Brief for context
    const { data: briefs, error: briefError } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', projectId)
      .limit(1);

    if (briefError) {
      return NextResponse.json({ error: briefError.message }, { status: 500 });
    }

    const briefContext = briefs && briefs.length > 0 ? briefs[0] : {};

    // Step 3: Delete existing pipeline_gaps for this asset set (clean re-analysis)
    const { error: deleteError } = await supabase
      .from('pipeline_gaps')
      .delete()
      .eq('asset_set_id', assetSetId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Step 4: Analyze adjacent node pairs
    let allDetectedGaps: { sourceNode: PipelineNode; targetNode: PipelineNode; gap: DetectedGap }[] = [];

    if (process.env.OPENAI_API_KEY) {
      // AI-powered analysis
      try {
        const aiGaps = await analyzeNodesAI(nodes, briefContext as Record<string, unknown>);

        // Map AI gaps back to node pairs (AI returns gaps in sequence order)
        // For AI results, we distribute gaps to the most relevant node pair
        for (const gap of aiGaps) {
          // Default to first pair if we can't determine the source
          const sourceNode = nodes[0];
          const targetNode = nodes[1];
          allDetectedGaps.push({ sourceNode, targetNode, gap });
        }
      } catch (aiError) {
        console.error('AI gap analysis failed, falling back to heuristic:', aiError);
        // Fall back to heuristic
        allDetectedGaps = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          const gaps = analyzeNodePairHeuristic(nodes[i], nodes[i + 1], nodes.length, i);
          for (const gap of gaps) {
            allDetectedGaps.push({ sourceNode: nodes[i], targetNode: nodes[i + 1], gap });
          }
        }
      }
    } else {
      // Heuristic mode (default, no API key needed)
      for (let i = 0; i < nodes.length - 1; i++) {
        const gaps = analyzeNodePairHeuristic(nodes[i], nodes[i + 1], nodes.length, i);
        for (const gap of gaps) {
          allDetectedGaps.push({ sourceNode: nodes[i], targetNode: nodes[i + 1], gap });
        }
      }
    }

    if (allDetectedGaps.length === 0) {
      return NextResponse.json([]);
    }

    // Step 5: Batch insert all detected gaps
    const gapRows = allDetectedGaps.map(({ sourceNode, targetNode, gap }) => ({
      project_id: projectId,
      asset_set_id: assetSetId,
      source_node_id: sourceNode.id,
      target_node_id: targetNode.id,
      gap_type: gap.gapType,
      severity: gap.severity,
      status: 'detected',
      title: gap.title,
      description: gap.description,
      suggestion: gap.suggestion,
      metadata: {
        analysisMethod: process.env.OPENAI_API_KEY ? 'ai' : 'heuristic',
      },
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('pipeline_gaps')
      .insert(gapRows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Step 6: Return inserted gaps sorted by source node position
    const insertedGaps = (inserted ?? []).map((row) =>
      mapRowToGap(row as Record<string, unknown>)
    );

    // Sort by the source node's position in the original node list
    const nodePositionMap = new Map(nodes.map((n) => [n.id, n.position]));
    insertedGaps.sort((a, b) => {
      const posA = nodePositionMap.get(a.sourceNodeId) ?? 0;
      const posB = nodePositionMap.get(b.sourceNodeId) ?? 0;
      if (posA !== posB) return posA - posB;
      return a.gapType.localeCompare(b.gapType);
    });

    return NextResponse.json(insertedGaps, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
