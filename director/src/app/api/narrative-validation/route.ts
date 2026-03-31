const SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ValidationIssue } from '@/lib/types/narrative-validation';

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
 * Map snake_case DB row to camelCase ValidationIssue
 */
function mapRowToIssue(row: Record<string, unknown>): ValidationIssue {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    assetSetId: row.asset_set_id as string,
    nodeId: row.node_id as string,
    category: row.category as ValidationIssue['category'],
    severity: row.severity as ValidationIssue['severity'],
    status: row.status as ValidationIssue['status'],
    title: row.title as string,
    description: row.description as string,
    suggestion: row.suggestion as string,
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

    // Join with pipeline_nodes to order by node position
    const { data, error } = await supabase
      .from('narrative_validations')
      .select('*, node:pipeline_nodes!node_id(position)')
      .eq('project_id', projectId)
      .eq('asset_set_id', assetSetId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort by node position, then by severity (critical first)
    const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
    const issues = (data ?? [])
      .sort((a, b) => {
        const posA = (a.node as Record<string, unknown>)?.position as number ?? 0;
        const posB = (b.node as Record<string, unknown>)?.position as number ?? 0;
        if (posA !== posB) return posA - posB;
        return (severityOrder[a.severity as string] ?? 3) - (severityOrder[b.severity as string] ?? 3);
      })
      .map((row) => {
        // Remove the joined node before mapping
        const { node: _node, ...issueRow } = row;
        return mapRowToIssue(issueRow as Record<string, unknown>);
      });

    return NextResponse.json(issues);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.json({ message: "Supabase not configured — running in local mode" }, { status: 200 });
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status field required in body' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('narrative_validations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRowToIssue(data));
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
      .from('narrative_validations')
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
