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

export async function GET(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json([], { status: 200 });
  const projectId = request.nextUrl.searchParams.get('projectId');
  const assetSetId = request.nextUrl.searchParams.get('assetSetId');

  if (!projectId || !assetSetId) {
    return NextResponse.json(
      { error: 'projectId and assetSetId required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('pipeline_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('asset_set_id', assetSetId)
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nodes = (data ?? []).map(mapRowToNode);
    return NextResponse.json(nodes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  try {
    const body = await request.json();

    if (!body.projectId || !body.assetSetId || !body.assetItemId) {
      return NextResponse.json(
        { error: 'projectId, assetSetId, and assetItemId are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('pipeline_nodes')
      .insert({
        project_id: body.projectId,
        asset_set_id: body.assetSetId,
        asset_item_id: body.assetItemId,
        position: body.position ?? 0,
        title: body.title?.trim() ?? '',
        description: body.description?.trim() ?? '',
        status: 'pending',
        narrative_context: body.narrativeContext ?? {},
        thumbnail_url: body.thumbnailUrl ?? null,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToNode(data), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const nodeId = request.nextUrl.searchParams.get('id');
  const assetSetId = request.nextUrl.searchParams.get('assetSetId');

  try {
    const body = await request.json();
    const supabase = await createServerSupabase();

    // Single-node status update: PUT /api/pipeline-nodes?id=<nodeId> with { status }
    if (nodeId && body.status) {
      const { data, error } = await supabase
        .from('pipeline_nodes')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', nodeId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(mapRowToNode(data));
    }

    // Batch reorder: PUT /api/pipeline-nodes?assetSetId=<id> with { nodeIds }
    if (!assetSetId) {
      return NextResponse.json(
        { error: 'assetSetId query param required (or id + status for single-node update)' },
        { status: 400 }
      );
    }

    const nodeIds: string[] = body.nodeIds;

    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return NextResponse.json(
        { error: 'nodeIds array required' },
        { status: 400 }
      );
    }

    // Update position for each node
    const updates = nodeIds.map((id, index) =>
      supabase
        .from('pipeline_nodes')
        .update({ position: index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('asset_set_id', assetSetId)
    );

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) {
      return NextResponse.json(
        { error: firstError.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('pipeline_nodes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
