const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { PipelineNode } from '@/lib/types/pipeline-node';
import type { NarrativeBeat } from '@/lib/types/directors-brief';

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

    // Step 1: Fetch asset set items ordered by position
    const { data: items, error: itemsError } = await supabase
      .from('asset_set_items')
      .select('*')
      .eq('asset_set_id', assetSetId)
      .order('position', { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Asset set has no items' },
        { status: 400 }
      );
    }

    // Step 2: Fetch the Director's Brief from director_cuts
    const { data: briefs, error: briefError } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', projectId)
      .limit(1);

    if (briefError) {
      return NextResponse.json(
        { error: briefError.message },
        { status: 500 }
      );
    }

    if (!briefs || briefs.length === 0) {
      return NextResponse.json(
        { error: "No Director's Brief found for this project" },
        { status: 400 }
      );
    }

    const brief = briefs[0];

    // Step 3: Extract narrative beats and map to items
    const narrativeBeatsData = (brief.narrative_beats as Record<string, unknown>) ?? {};
    const beats: NarrativeBeat[] = Array.isArray(narrativeBeatsData.beats)
      ? (narrativeBeatsData.beats as NarrativeBeat[])
      : [];

    // Step 4: Delete existing pipeline nodes for this asset set (clean regeneration)
    const { error: deleteError } = await supabase
      .from('pipeline_nodes')
      .delete()
      .eq('asset_set_id', assetSetId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // Step 5: Build node rows from items + beats
    const nodeRows = items.map((item, index) => {
      const beat = index < beats.length ? beats[index] : null;

      const title = beat?.label || (item.name as string) || `Node ${index + 1}`;
      const description = beat
        ? `${beat.emotion || 'neutral'} moment`
        : '';
      const emotionalTone = beat?.emotion || 'neutral';
      const transitionFromPrevious = index === 0
        ? null
        : (beat?.transition || 'cut');
      const durationHint = '3-5 seconds';
      const thumbnailUrl = (item.thumbnail_url as string) || (item.url as string) || null;

      return {
        project_id: projectId,
        asset_set_id: assetSetId,
        asset_item_id: item.id as string,
        position: index,
        title,
        description,
        status: 'pending',
        narrative_context: {
          emotionalTone,
          transitionFromPrevious,
          durationHint,
        },
        thumbnail_url: thumbnailUrl,
        metadata: {},
      };
    });

    // Batch insert all nodes
    const { data: inserted, error: insertError } = await supabase
      .from('pipeline_nodes')
      .insert(nodeRows)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Step 6: Return created nodes
    const nodes = (inserted ?? [])
      .map(mapRowToNode)
      .sort((a, b) => a.position - b.position);

    return NextResponse.json(nodes, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
