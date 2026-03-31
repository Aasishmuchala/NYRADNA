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

/**
 * Determine asset type from MIME type
 */
function getAssetType(mimeType: string): 'image' | 'video' | 'audio' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image'; // Default to image
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const setId = request.nextUrl.searchParams.get('setId');

  if (!setId) {
    return NextResponse.json({ error: 'setId query parameter required' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Generate unique storage path
    const fileId = crypto.randomUUID();
    const storagePath = `assets/${setId}/${fileId}-${file.name}`;

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Determine asset type from MIME
    const assetType = getAssetType(file.type);

    // Calculate next position for the set
    const { data: maxRow } = await supabase
      .from('asset_set_items')
      .select('position')
      .eq('asset_set_id', setId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = maxRow ? (maxRow.position as number) + 1 : 0;

    // Insert into asset_set_items
    const { data, error: insertError } = await supabase
      .from('asset_set_items')
      .insert({
        asset_set_id: setId,
        name: file.name,
        type: assetType,
        url: publicUrl,
        thumbnail_url: null,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          storagePath,
        },
        position: nextPosition,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToItem(data), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
