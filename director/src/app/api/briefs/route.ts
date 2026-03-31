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
 * Map snake_case DB row to camelCase DirectorsBrief
 */
function mapRowToBrief(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    storyline: row.storyline,
    visualStyle: row.visual_style,
    narrativeBeats: row.narrative_beats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const projectId = request.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('director_cuts')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({ error: 'not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToBrief(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.storyline || !body.visualStyle || !body.narrativeBeats) {
      return NextResponse.json(
        { error: 'storyline, visualStyle, and narrativeBeats are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('director_cuts')
      .upsert(
        {
          id: body.id,
          project_id: body.projectId,
          storyline: body.storyline,
          visual_style: body.visualStyle,
          narrative_beats: body.narrativeBeats,
          created_at: body.createdAt || now,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToBrief(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
