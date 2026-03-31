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

/**
 * GET /api/asset-sets/generated
 *
 * Returns all generated asset items (gap-fill and video-generation)
 * for a given project, ordered by creation date descending.
 *
 * Query params:
 *   - projectId (required): The project to filter by
 */
export async function GET(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json([], { status: 200 });
  const projectId = request.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('asset_set_items')
      .select('*, asset_sets!inner(project_id)')
      .eq('asset_sets.project_id', projectId)
      .or('metadata->>source.eq.gap-fill,metadata->>source.eq.video-generation')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => mapRowToItem(row));

    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
