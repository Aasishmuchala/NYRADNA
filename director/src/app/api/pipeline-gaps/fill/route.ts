const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { PipelineGap } from '@/lib/types/pipeline-gap';
import type { PipelineNode } from '@/lib/types/pipeline-node';

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
    fillNodeId: (row.fill_node_id as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
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
 * Build an image generation prompt from gap context and Director's Brief
 */
function buildFillPrompt(
  gap: PipelineGap,
  sourceNode: PipelineNode,
  targetNode: PipelineNode,
  briefRow: Record<string, unknown> | null
): string {
  const suggestion = gap.suggestion;
  const sourceTone = sourceNode.narrativeContext.emotionalTone;
  const targetTone = targetNode.narrativeContext.emotionalTone;

  // Extract Director's Brief fields from the DB row (JSONB columns)
  let mood = 'cinematic';
  let palette = 'warm tones';
  let cinematography = 'wide shot';
  let theme = 'visual storytelling';

  if (briefRow) {
    const storyline = (briefRow.storyline as Record<string, unknown>) ?? {};
    const visualStyle = (briefRow.visual_style as Record<string, unknown>) ?? {};

    theme = (storyline.theme as string) || theme;
    mood = (visualStyle.mood as string) || mood;

    const colorPalette = (visualStyle.colorPalette as string[]) ?? [];
    if (colorPalette.length > 0) {
      palette = colorPalette.join(', ');
    }

    const cinematographyRefs = (visualStyle.cinematographyRefs as string[]) ?? [];
    if (cinematographyRefs.length > 0) {
      cinematography = cinematographyRefs[0];
    }
  }

  return `Bridge scene: ${suggestion}. Style: ${mood} mood, ${palette} palette, ${cinematography}. Theme: ${theme}. Transition from ${sourceTone} to ${targetTone} emotional tone.`;
}

/**
 * Generate image using Replicate API (production mode)
 */
async function generateImageReplicate(prompt: string): Promise<string> {
  // Dynamic import to avoid requiring replicate when not in use
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Replicate = (await import(/* webpackIgnore: true */ 'replicate' as string)).default as new (opts: { auth: string }) => {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  });

  const output = await replicate.run('black-forest-labs/flux-schnell', {
    input: {
      prompt,
      num_outputs: 1,
      aspect_ratio: '16:9',
    },
  });

  // flux-schnell returns an array of URLs or FileOutput objects
  const results = output as unknown[];
  if (results && results.length > 0) {
    const first = results[0];
    // Handle both string URLs and FileOutput objects
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      return (first as { url: () => string }).url();
    }
  }

  throw new Error('No output URL returned from Replicate');
}

/**
 * Generate mock placeholder image (default dev mode)
 */
function generateImageMock(gapId: string): string {
  console.log(`[gap-fill] Mock mode: skipping image generation for gap ${gapId}`);
  return 'https://placehold.co/1024x576/1a1a1a/ff9064?text=Bridge+Scene';
}

/**
 * POST /api/pipeline-gaps/fill
 *
 * Fills a detected gap by:
 * 1. Generating a bridge scene image (Replicate or mock)
 * 2. Inserting an asset_set_item with gap-fill metadata
 * 3. Inserting a bridge pipeline_node at the correct position
 * 4. Shifting existing positions to make room
 * 5. Marking the gap as 'filled' with fill_node_id
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const supabase = await createServerSupabase();
  let gapId: string | undefined;

  try {
    const body = await request.json();
    gapId = body.gapId;

    if (!gapId) {
      return NextResponse.json(
        { error: 'gapId required in request body' },
        { status: 400 }
      );
    }

    // Step a: Fetch gap and validate status
    const { data: gapRow, error: gapError } = await supabase
      .from('pipeline_gaps')
      .select('*')
      .eq('id', gapId)
      .single();

    if (gapError || !gapRow) {
      return NextResponse.json(
        { error: gapError?.message ?? 'Gap not found' },
        { status: 404 }
      );
    }

    const gap = mapRowToGap(gapRow as Record<string, unknown>);

    if (gap.status !== 'fill-requested') {
      return NextResponse.json(
        { error: `Gap status must be 'fill-requested' to fill, got '${gap.status}'` },
        { status: 400 }
      );
    }

    // Step b: Set gap status to 'generating'
    const { error: genStatusError } = await supabase
      .from('pipeline_gaps')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', gapId);

    if (genStatusError) {
      return NextResponse.json(
        { error: genStatusError.message },
        { status: 500 }
      );
    }

    // Step c: Fetch source and target pipeline_nodes
    const { data: sourceRow, error: sourceError } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('id', gap.sourceNodeId)
      .single();

    if (sourceError || !sourceRow) {
      throw new Error(`Source node not found: ${sourceError?.message ?? gap.sourceNodeId}`);
    }

    const { data: targetRow, error: targetError } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('id', gap.targetNodeId)
      .single();

    if (targetError || !targetRow) {
      throw new Error(`Target node not found: ${targetError?.message ?? gap.targetNodeId}`);
    }

    const sourceNode = mapRowToNode(sourceRow as Record<string, unknown>);
    const targetNode = mapRowToNode(targetRow as Record<string, unknown>);

    // Step d: Fetch Director's Brief for prompt context
    const { data: briefs } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', gap.projectId)
      .limit(1);

    const briefRow = briefs && briefs.length > 0
      ? (briefs[0] as Record<string, unknown>)
      : null;

    // Step e: Build image generation prompt
    const fillPrompt = buildFillPrompt(gap, sourceNode, targetNode, briefRow);

    // Step f: Generate image (Replicate or mock)
    let imageUrl: string;
    if (process.env.REPLICATE_API_TOKEN) {
      imageUrl = await generateImageReplicate(fillPrompt);
    } else {
      imageUrl = generateImageMock(gapId);
    }

    // Step g: Insert asset_set_item
    const bridgePosition = sourceNode.position + 1;

    // Step h: Shift existing asset_set_items positions to make room
    // Fetch, then shift from highest to lowest to avoid unique constraint conflicts
    const { data: existingItems } = await supabase
      .from('asset_set_items')
      .select('id, position')
      .eq('asset_set_id', gap.assetSetId)
      .gte('position', bridgePosition)
      .order('position', { ascending: false });

    if (existingItems && existingItems.length > 0) {
      // Shift from highest to lowest to avoid unique constraint conflicts
      for (const item of existingItems) {
        await supabase
          .from('asset_set_items')
          .update({ position: (item.position as number) + 1 })
          .eq('id', item.id);
      }
    }

    const { data: newAssetItem, error: assetInsertError } = await supabase
      .from('asset_set_items')
      .insert({
        asset_set_id: gap.assetSetId,
        name: `Bridge: ${sourceNode.title} -> ${targetNode.title}`,
        type: 'image',
        url: imageUrl,
        thumbnail_url: imageUrl,
        metadata: {
          source: 'gap-fill',
          gapId: gap.id,
          gapType: gap.gapType,
          generationPrompt: fillPrompt,
          briefId: briefRow ? (briefRow.id as string) : null,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
        },
        position: bridgePosition,
      })
      .select()
      .single();

    if (assetInsertError || !newAssetItem) {
      throw new Error(`Failed to insert asset: ${assetInsertError?.message ?? 'unknown'}`);
    }

    // Step i: Shift existing pipeline_nodes positions to make room
    const { data: existingNodes } = await supabase
      .from('pipeline_nodes')
      .select('id, position')
      .eq('asset_set_id', gap.assetSetId)
      .gt('position', sourceNode.position)
      .order('position', { ascending: false });

    if (existingNodes && existingNodes.length > 0) {
      for (const node of existingNodes) {
        await supabase
          .from('pipeline_nodes')
          .update({ position: (node.position as number) + 1 })
          .eq('id', node.id);
      }
    }

    // Step j: Insert bridge pipeline_node
    const { data: newNodeRow, error: nodeInsertError } = await supabase
      .from('pipeline_nodes')
      .insert({
        project_id: gap.projectId,
        asset_set_id: gap.assetSetId,
        asset_item_id: (newAssetItem as Record<string, unknown>).id as string,
        position: bridgePosition,
        title: `Bridge: ${sourceNode.title} -> ${targetNode.title}`,
        description: gap.suggestion,
        status: 'ready',
        narrative_context: {
          emotionalTone: 'transitional',
          transitionFromPrevious: 'dissolve',
          durationHint: '2-3 seconds',
        },
        thumbnail_url: imageUrl,
        metadata: {
          source: 'gap-fill',
          gapId: gap.id,
        },
      })
      .select()
      .single();

    if (nodeInsertError || !newNodeRow) {
      throw new Error(`Failed to insert bridge node: ${nodeInsertError?.message ?? 'unknown'}`);
    }

    const newNodeId = (newNodeRow as Record<string, unknown>).id as string;

    // Step k: Update gap status to 'filled' and set fill_node_id
    const { data: filledGapRow, error: fillError } = await supabase
      .from('pipeline_gaps')
      .update({
        status: 'filled',
        fill_node_id: newNodeId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gapId)
      .select()
      .single();

    if (fillError || !filledGapRow) {
      throw new Error(`Failed to update gap as filled: ${fillError?.message ?? 'unknown'}`);
    }

    // Step l: Return the updated PipelineGap
    const filledGap = mapRowToGap(filledGapRow as Record<string, unknown>);
    return NextResponse.json(filledGap);
  } catch (err) {
    // Error recovery: revert gap status back to fill-requested for retryability
    if (gapId) {
      try {
        await supabase
          .from('pipeline_gaps')
          .update({ status: 'fill-requested', updated_at: new Date().toISOString() })
          .eq('id', gapId);
      } catch {
        // Best-effort revert -- ignore errors
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[gap-fill] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
