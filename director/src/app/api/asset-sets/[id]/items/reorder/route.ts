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
              // setAll can fail in read-only contexts
            }
          });
        },
      },
    }
  );
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const { id: setId } = await params;

  try {
    const body = await request.json();
    const itemIds: string[] = body.itemIds;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds array is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Update each item's position in parallel
    await Promise.all(
      itemIds.map((itemId, index) =>
        supabase
          .from('asset_set_items')
          .update({ position: index })
          .eq('id', itemId)
          .eq('asset_set_id', setId)
      )
    );

    // Fetch updated items to return
    const { data, error } = await supabase
      .from('asset_set_items')
      .select('*')
      .eq('asset_set_id', setId)
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(mapRowToItem));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
