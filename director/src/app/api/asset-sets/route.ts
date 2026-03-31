const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
 * Map snake_case DB row to camelCase AssetSet (without items)
 */
function mapRowToAssetSet(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    description: row.description as string,
    items: [] as ReturnType<typeof mapRowToItem>[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Map snake_case DB row to camelCase AssetSetItem
 */
function mapRowToItem(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    assetSetId: row.asset_set_id as string,
    name: row.name as string,
    type: row.type as string,
    url: row.url as string,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    position: row.position as number,
    createdAt: row.created_at as string,
  };
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json([], { status: 200 });
  const projectId = request.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();

    // Fetch all asset sets for the project
    const { data: sets, error: setsError } = await supabase
      .from('asset_sets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (setsError) {
      return NextResponse.json({ error: setsError.message }, { status: 500 });
    }

    if (!sets || sets.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all items for these sets in one query
    const setIds = sets.map((s) => s.id);
    const { data: items, error: itemsError } = await supabase
      .from('asset_set_items')
      .select('*')
      .in('asset_set_id', setIds)
      .order('position', { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Group items by set ID
    const itemsBySetId = new Map<string, ReturnType<typeof mapRowToItem>[]>();
    for (const item of items ?? []) {
      const setId = item.asset_set_id as string;
      if (!itemsBySetId.has(setId)) {
        itemsBySetId.set(setId, []);
      }
      itemsBySetId.get(setId)!.push(mapRowToItem(item));
    }

    // Build response with items embedded
    const result = sets.map((row) => {
      const mapped = mapRowToAssetSet(row);
      mapped.items = itemsBySetId.get(mapped.id) ?? [];
      return mapped;
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  try {
    const body = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!body.projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('asset_sets')
      .insert({
        project_id: body.projectId,
        name: body.name.trim(),
        description: body.description?.trim() ?? '',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = mapRowToAssetSet(data);
    return NextResponse.json(result, { status: 201 });
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
      .from('asset_sets')
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
