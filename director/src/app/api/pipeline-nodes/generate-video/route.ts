const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
 * Build a video generation prompt from node context and Director's Brief
 */
function buildVideoPrompt(
  node: PipelineNode,
  priorNodes: PipelineNode[],
  briefRow: Record<string, unknown> | null
): string {
  // Extract Director's Brief fields
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

  // Build reference context from prior completed nodes
  let referenceContext = '';
  if (priorNodes.length > 0) {
    const priorDescriptions = priorNodes
      .map((n) => `"${n.title}" (${n.narrativeContext.emotionalTone})`)
      .join(', ');
    referenceContext = ` Maintain visual consistency with prior segments: ${priorDescriptions}.`;
  }

  // Build transition context
  const transition = node.narrativeContext.transitionFromPrevious
    ? ` Transition: ${node.narrativeContext.transitionFromPrevious}.`
    : '';

  return `Video scene: ${node.title}. ${node.description}. Emotional tone: ${node.narrativeContext.emotionalTone}. Duration: ${node.narrativeContext.durationHint}.${transition} Style: ${mood} mood, ${palette} palette, ${cinematography}. Theme: ${theme}.${referenceContext}`;
}

/**
 * Generate video using Replicate API (production mode)
 */
async function generateVideoReplicate(
  prompt: string,
  imageUrl: string
): Promise<string> {
  // Dynamic import to avoid requiring replicate when not in use
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Replicate = (await import(/* webpackIgnore: true */ 'replicate' as string)).default as new (opts: { auth: string }) => {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  });

  const output = await replicate.run('minimax/video-01-live', {
    input: {
      prompt,
      prompt_image_url: imageUrl,
      prompt_optimizer: true,
    },
  });

  // minimax/video-01-live returns an array of URLs or FileOutput objects
  const results = output as unknown[];
  if (results && Array.isArray(results) && results.length > 0) {
    const first = results[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      return (first as { url: () => string }).url();
    }
  }

  // Handle single URL or FileOutput response
  if (typeof output === 'string') return output;
  if (output && typeof output === 'object' && 'url' in output) {
    return (output as { url: () => string }).url();
  }

  throw new Error('No output URL returned from Replicate');
}

/**
 * Generate mock placeholder video URL (default dev mode)
 */
function generateVideoMock(position: number): string {
  console.log(`[video-gen] Mock mode: skipping video generation for node at position ${position}`);
  return `https://placehold.co/1024x576/1a1a1a/ff9064?text=Video+Node+${position}`;
}

/**
 * POST /api/pipeline-nodes/generate-video
 *
 * Generates a video for a single pipeline node by:
 * 1. Fetching the node and validating its status
 * 2. Gathering reference images from prior completed nodes (GEN-02)
 * 3. Fetching Director's Brief for prompt context
 * 4. Generating video via Replicate (or mock)
 * 5. Inserting an asset_set_item for the completed video
 * 6. Updating the pipeline node with video_url and 'completed' status
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const supabase = await createServerSupabase();
  let nodeId: string | undefined;

  try {
    const body = await request.json();
    nodeId = body.nodeId;

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId required in request body' },
        { status: 400 }
      );
    }

    // Step a: Fetch the pipeline node and validate status
    const { data: nodeRow, error: nodeError } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError || !nodeRow) {
      return NextResponse.json(
        { error: nodeError?.message ?? 'Node not found' },
        { status: 404 }
      );
    }

    const node = mapRowToNode(nodeRow as Record<string, unknown>);

    if (node.status !== 'pending' && node.status !== 'ready') {
      return NextResponse.json(
        { error: `Node status must be 'pending' or 'ready' to generate video, got '${node.status}'` },
        { status: 400 }
      );
    }

    // Step b: Set node status to 'generating'
    const { error: genStatusError } = await supabase
      .from('pipeline_nodes')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', nodeId);

    if (genStatusError) {
      return NextResponse.json(
        { error: genStatusError.message },
        { status: 500 }
      );
    }

    // Step c: Fetch the source asset_set_item to get the asset URL
    const { data: assetItem, error: assetError } = await supabase
      .from('asset_set_items')
      .select('*')
      .eq('id', node.assetItemId)
      .single();

    if (assetError || !assetItem) {
      throw new Error(`Source asset not found: ${assetError?.message ?? node.assetItemId}`);
    }

    const sourceImageUrl = (assetItem as Record<string, unknown>).url as string;

    // Step d: Fetch completed prior nodes for reference images (GEN-02)
    const { data: priorNodeRows } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('asset_set_id', node.assetSetId)
      .lt('position', node.position)
      .eq('status', 'completed')
      .order('position', { ascending: false })
      .limit(2);

    const priorNodes = (priorNodeRows ?? []).map((r: Record<string, unknown>) => mapRowToNode(r));

    // Step e: Fetch Director's Brief for prompt context
    const { data: briefs } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', node.projectId)
      .limit(1);

    const briefRow = briefs && briefs.length > 0
      ? (briefs[0] as Record<string, unknown>)
      : null;

    // Step f: Build video generation prompt
    const videoPrompt = buildVideoPrompt(node, priorNodes, briefRow);

    // Step g: Generate video (Replicate or mock)
    let videoUrl: string;
    if (process.env.REPLICATE_API_TOKEN) {
      videoUrl = await generateVideoReplicate(videoPrompt, sourceImageUrl);
    } else {
      videoUrl = generateVideoMock(node.position);
    }

    // Step h: Insert a new asset_set_item for the generated video
    const priorNodeIds = priorNodes.map((n) => n.id);
    const { data: newAssetItem, error: assetInsertError } = await supabase
      .from('asset_set_items')
      .insert({
        asset_set_id: node.assetSetId,
        name: `Video: ${node.title}`,
        type: 'video',
        url: videoUrl,
        thumbnail_url: node.thumbnailUrl,
        metadata: {
          source: 'video-generation',
          nodeId: node.id,
          projectId: node.projectId,
          generationPrompt: videoPrompt,
          referenceNodes: priorNodeIds,
          briefId: briefRow ? (briefRow.id as string) : null,
        },
        position: node.position,
      })
      .select()
      .single();

    if (assetInsertError || !newAssetItem) {
      throw new Error(`Failed to insert video asset: ${assetInsertError?.message ?? 'unknown'}`);
    }

    // Step i: Update pipeline node with video_url and completed status
    const { data: updatedNodeRow, error: updateError } = await supabase
      .from('pipeline_nodes')
      .update({
        status: 'completed',
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId)
      .select()
      .single();

    if (updateError || !updatedNodeRow) {
      throw new Error(`Failed to update node: ${updateError?.message ?? 'unknown'}`);
    }

    // Step j: Return the updated PipelineNode
    return NextResponse.json(mapRowToNode(updatedNodeRow as Record<string, unknown>));
  } catch (err) {
    // Error recovery: revert node status to 'error' with error message in metadata
    if (nodeId) {
      try {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await supabase
          .from('pipeline_nodes')
          .update({
            status: 'error',
            metadata: { error: message },
            updated_at: new Date().toISOString(),
          })
          .eq('id', nodeId);
      } catch {
        // Best-effort revert -- ignore errors
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[video-gen] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
