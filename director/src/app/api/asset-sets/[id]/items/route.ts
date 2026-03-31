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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json([], { status: 200 });
  const { id: setId } = await params;

  try {
    const supabase = await createServerSupabase();
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const { id: setId } = await params;

  try {
    const body = await request.json();

    if (!body.name || !body.type || !body.url) {
      return NextResponse.json(
        { error: 'name, type, and url are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Calculate next position
    const { data: maxRow } = await supabase
      .from('asset_set_items')
      .select('position')
      .eq('asset_set_id', setId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = maxRow ? (maxRow.position as number) + 1 : 0;

    const { data, error } = await supabase
      .from('asset_set_items')
      .insert({
        asset_set_id: setId,
        name: body.name,
        type: body.type,
        url: body.url,
        thumbnail_url: body.thumbnailUrl ?? null,
        metadata: body.metadata ?? {},
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToItem(data), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const { id: setId } = await params;
  const itemId = request.nextUrl.searchParams.get('itemId');

  if (!itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();

    // Delete the item
    const { error: deleteError } = await supabase
      .from('asset_set_items')
      .delete()
      .eq('id', itemId)
      .eq('asset_set_id', setId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Re-index remaining items' positions
    const { data: remaining, error: fetchError } = await supabase
      .from('asset_set_items')
      .select('id')
      .eq('asset_set_id', setId)
      .order('position', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (remaining && remaining.length > 0) {
      await Promise.all(
        remaining.map((row, idx) =>
          supabase
            .from('asset_set_items')
            .update({ position: idx })
            .eq('id', row.id)
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
