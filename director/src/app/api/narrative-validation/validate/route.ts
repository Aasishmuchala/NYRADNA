const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { PipelineNode } from '@/lib/types/pipeline-node';
import type { ValidationIssue } from '@/lib/types/narrative-validation';

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
 * Map snake_case DB row to camelCase ValidationIssue
 */
function mapRowToIssue(row: Record<string, unknown>): ValidationIssue {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    assetSetId: row.asset_set_id as string,
    nodeId: row.node_id as string,
    category: row.category as ValidationIssue['category'],
    severity: row.severity as ValidationIssue['severity'],
    status: row.status as ValidationIssue['status'],
    title: row.title as string,
    description: row.description as string,
    suggestion: row.suggestion as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// --- Tone contrast pairs for story-flow detection ---
const TONE_CONTRAST_PAIRS: [string[], string[]][] = [
  [['joy', 'happy', 'uplifting', 'energetic', 'bright'], ['dark', 'somber', 'tragic', 'melancholic', 'gloomy']],
];

function tonesContrast(toneA: string, toneB: string): boolean {
  const a = toneA.toLowerCase();
  const b = toneB.toLowerCase();
  for (const [groupA, groupB] of TONE_CONTRAST_PAIRS) {
    const aInFirst = groupA.some((word) => a.includes(word));
    const aInSecond = groupB.some((word) => a.includes(word));
    const bInFirst = groupA.some((word) => b.includes(word));
    const bInSecond = groupB.some((word) => b.includes(word));

    if ((aInFirst && bInSecond) || (aInSecond && bInFirst)) {
      return true;
    }
  }
  return false;
}

const TRANSITION_KEYWORDS = ['dissolve', 'fade', 'crossfade', 'wipe', 'morph'];
const CONCLUSIVE_KEYWORDS = ['resolution', 'calm', 'triumph', 'peace', 'closure', 'final', 'end'];

function hasTransitionKeyword(text: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return TRANSITION_KEYWORDS.some((kw) => lower.includes(kw));
}

interface DetectedIssue {
  nodeId: string;
  category: 'visual-style' | 'pacing' | 'story-flow';
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  description: string;
  suggestion: string;
}

/**
 * Heuristic validation (deterministic, default mode when no OPENAI_API_KEY).
 * Analyzes the full node sequence for visual style, pacing, and story flow issues.
 */
function analyzeSequenceHeuristic(nodes: PipelineNode[]): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  // --- Visual style issues ---

  // Bridge scene style check
  for (let i = 1; i < nodes.length - 1; i++) {
    const node = nodes[i];
    if (node.metadata?.source === 'gap-fill') {
      issues.push({
        nodeId: node.id,
        category: 'visual-style',
        severity: 'minor',
        title: 'Bridge scene may not match surrounding style',
        description: `Node "${node.title}" at position ${node.position} was generated as a gap-fill bridge and may have visual style differences from adjacent segments.`,
        suggestion: 'Review bridge scene visual consistency or regenerate',
      });
    }
  }

  // Visual monotony: 3+ consecutive nodes with identical emotionalTone
  for (let i = 1; i < nodes.length - 1; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const next = nodes[i + 1];
    if (
      prev.narrativeContext.emotionalTone.toLowerCase() === curr.narrativeContext.emotionalTone.toLowerCase() &&
      curr.narrativeContext.emotionalTone.toLowerCase() === next.narrativeContext.emotionalTone.toLowerCase()
    ) {
      issues.push({
        nodeId: curr.id,
        category: 'visual-style',
        severity: 'minor',
        title: 'Visual monotony in sequence',
        description: `Nodes at positions ${prev.position}-${next.position} share identical emotional tone "${curr.narrativeContext.emotionalTone}", which may result in visual repetition.`,
        suggestion: 'Consider varying the visual approach for this segment',
      });
    }
  }

  // --- Pacing issues ---

  // No transition variety across entire sequence
  if (nodes.length > 5) {
    const hasAnyTransition = nodes.some((n) =>
      hasTransitionKeyword(n.narrativeContext.transitionFromPrevious)
    );
    if (!hasAnyTransition) {
      const midIndex = Math.floor(nodes.length / 2);
      const midNode = nodes[midIndex];
      issues.push({
        nodeId: midNode.id,
        category: 'pacing',
        severity: 'moderate',
        title: 'No pacing variation across sequence',
        description: `The ${nodes.length}-node sequence contains no transition keywords (dissolve, fade, crossfade, wipe, morph), which may result in monotonous pacing.`,
        suggestion: 'Add transition variety to improve rhythm',
      });
    }
  }

  // Long segment detection
  for (const node of nodes) {
    const hint = node.narrativeContext.durationHint.toLowerCase();
    if (hint.includes('10+') || hint.includes('long')) {
      issues.push({
        nodeId: node.id,
        category: 'pacing',
        severity: 'minor',
        title: 'Potentially long segment may disrupt flow',
        description: `Node "${node.title}" at position ${node.position} has duration hint "${node.narrativeContext.durationHint}" which may be too long relative to other segments.`,
        suggestion: 'Consider splitting into shorter segments',
      });
    }
  }

  // --- Story flow issues ---

  // Opening node with unnecessary transition reference
  if (nodes.length > 0 && nodes[0].narrativeContext.transitionFromPrevious) {
    issues.push({
      nodeId: nodes[0].id,
      category: 'story-flow',
      severity: 'minor',
      title: 'Opening node has unnecessary transition reference',
      description: `The first node "${nodes[0].title}" has transitionFromPrevious set to "${nodes[0].narrativeContext.transitionFromPrevious}" but as the opening segment it should not reference a prior transition.`,
      suggestion: 'Remove transition context from opening segment',
    });
  }

  // Jarring emotional shifts between consecutive nodes
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const prevTone = prev.narrativeContext.emotionalTone;
    const currTone = curr.narrativeContext.emotionalTone;

    if (tonesContrast(prevTone, currTone) && !hasTransitionKeyword(curr.narrativeContext.transitionFromPrevious)) {
      issues.push({
        nodeId: curr.id,
        category: 'story-flow',
        severity: 'critical',
        title: 'Jarring emotional shift without transition',
        description: `Sharp emotional contrast between "${prev.title}" (${prevTone}) and "${curr.title}" (${currTone}) without a softening transition.`,
        suggestion: 'Add a bridge segment or soften the transition',
      });
    }
  }

  // Ending without resolution
  if (nodes.length > 0) {
    const lastNode = nodes[nodes.length - 1];
    const lastTone = lastNode.narrativeContext.emotionalTone.toLowerCase();
    const hasConclusion = CONCLUSIVE_KEYWORDS.some((kw) => lastTone.includes(kw));
    if (!hasConclusion) {
      issues.push({
        nodeId: lastNode.id,
        category: 'story-flow',
        severity: 'minor',
        title: 'Sequence ending may lack resolution',
        description: `The final node "${lastNode.title}" has emotional tone "${lastNode.narrativeContext.emotionalTone}" which does not reference conclusive keywords (resolution, calm, triumph, peace, closure, final, end).`,
        suggestion: 'Consider adjusting the final segment\'s tone for narrative closure',
      });
    }
  }

  return issues;
}

/**
 * AI-powered validation using OpenAI API.
 * Falls back to heuristic on failure.
 */
async function analyzeSequenceAI(
  nodes: PipelineNode[],
  briefContext: Record<string, unknown>
): Promise<DetectedIssue[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const systemPrompt = `You are a narrative coherence analyst for AI video production. Given a complete sequence of pipeline nodes and a Director's Brief, analyze the full sequence for issues in three categories: visual-style (style/color/composition drift), pacing (rhythm, duration, transition flow), and story-flow (emotional arc, narrative logic, resolution). For each issue, return: nodeId (the ID of the problematic node), category ('visual-style'|'pacing'|'story-flow'), severity ('critical'|'moderate'|'minor'), title, description, suggestion. Return ONLY a valid JSON array of issue objects. Return [] if no issues found.`;

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
              id: n.id,
              position: n.position,
              title: n.title,
              description: n.description,
              emotionalTone: n.narrativeContext.emotionalTone,
              transitionFromPrevious: n.narrativeContext.transitionFromPrevious,
              durationHint: n.narrativeContext.durationHint,
              hasVideo: !!n.videoUrl,
              isBridge: n.metadata?.source === 'gap-fill',
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
  // Handle both { issues: [...] } and direct array responses
  const issuesArray = Array.isArray(parsed) ? parsed : (parsed.issues ?? []);

  return issuesArray.map((i: Record<string, unknown>) => ({
    nodeId: (i.nodeId as string) || '',
    category: i.category as 'visual-style' | 'pacing' | 'story-flow',
    severity: i.severity as 'critical' | 'moderate' | 'minor',
    title: (i.title as string) || '',
    description: (i.description as string) || '',
    suggestion: (i.suggestion as string) || '',
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

    // Step 1: Fetch all pipeline_nodes for the asset set ordered by position
    const { data: nodeRows, error: nodesError } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('asset_set_id', assetSetId)
      .order('position', { ascending: true });

    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    if (!nodeRows || nodeRows.length === 0) {
      return NextResponse.json(
        { error: 'No pipeline nodes found for this asset set' },
        { status: 400 }
      );
    }

    const nodes = nodeRows.map(mapRowToNode);

    // Step 2: Verify all nodes have status 'completed' (NAR-01)
    const incompleteNodes = nodes.filter((n) => n.status !== 'completed');
    if (incompleteNodes.length > 0) {
      return NextResponse.json(
        {
          error: 'All pipeline nodes must be completed before validation',
          incompleteCount: incompleteNodes.length,
          incompletePositions: incompleteNodes.map((n) => n.position),
        },
        { status: 400 }
      );
    }

    // Step 3: Fetch Director's Brief for context
    const { data: briefs, error: briefError } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', projectId)
      .limit(1);

    if (briefError) {
      return NextResponse.json({ error: briefError.message }, { status: 500 });
    }

    const briefContext = briefs && briefs.length > 0 ? briefs[0] : {};

    // Step 4: Delete existing narrative_validations for this asset set (clean re-analysis)
    const { error: deleteError } = await supabase
      .from('narrative_validations')
      .delete()
      .eq('asset_set_id', assetSetId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Step 5: Run analysis (heuristic or AI based on OPENAI_API_KEY)
    let detectedIssues: DetectedIssue[];

    if (process.env.OPENAI_API_KEY) {
      // AI-powered analysis with fallback to heuristic
      try {
        detectedIssues = await analyzeSequenceAI(nodes, briefContext as Record<string, unknown>);
      } catch (aiError) {
        console.error('AI validation failed, falling back to heuristic:', aiError);
        detectedIssues = analyzeSequenceHeuristic(nodes);
      }
    } else {
      // Heuristic mode (default, no API key needed)
      detectedIssues = analyzeSequenceHeuristic(nodes);
    }

    if (detectedIssues.length === 0) {
      return NextResponse.json([]);
    }

    // Step 6: Batch insert detected issues
    const issueRows = detectedIssues.map((issue) => ({
      project_id: projectId,
      asset_set_id: assetSetId,
      node_id: issue.nodeId,
      category: issue.category,
      severity: issue.severity,
      status: 'flagged',
      title: issue.title,
      description: issue.description,
      suggestion: issue.suggestion,
      metadata: {
        analysisMethod: process.env.OPENAI_API_KEY ? 'ai' : 'heuristic',
      },
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('narrative_validations')
      .insert(issueRows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Step 7: Return inserted issues sorted by node position
    const insertedIssues = (inserted ?? []).map((row) =>
      mapRowToIssue(row as Record<string, unknown>)
    );

    // Sort by the node's position in the original node list
    const nodePositionMap = new Map(nodes.map((n) => [n.id, n.position]));
    insertedIssues.sort((a, b) => {
      const posA = nodePositionMap.get(a.nodeId) ?? 0;
      const posB = nodePositionMap.get(b.nodeId) ?? 0;
      if (posA !== posB) return posA - posB;
      // Secondary sort: severity (critical first)
      const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
      return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    });

    return NextResponse.json(insertedIssues, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
