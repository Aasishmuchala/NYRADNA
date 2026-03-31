# Phase 3: Asset Initialization - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Create asset set management — named collections of assets representing narrative segments. Users can create sets, add existing assets, upload new ones, reorder via drag, and persist to Supabase. This is the input layer for pipeline node generation (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion. Key guidelines:

- Supabase tables: asset_sets + asset_set_items (junction with position)
- Supabase storage bucket for uploaded asset files
- Zustand store for asset set state
- API routes for CRUD
- Asset set management page (new route or section within existing pages)
- @dnd-kit for drag-to-reorder (install needed)
- Upload via Supabase Storage + FileUploadZone component
- Follow existing NYRADNA dark theme patterns

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Supabase client from Phase 2 (src/lib/supabase.ts)
- Pipeline store + types from Phase 1
- Directors brief store pattern from Phase 2 — Zustand + API sync
- API route pattern from Phase 2 (/api/briefs/route.ts)
- Existing page layout patterns (two-column, dark theme, footer nav)

### Integration Points
- Pipeline store — asset initialization could be a stage
- Director's Brief — asset sets link to projects
- Phase 4 (node generation) — consumes asset sets

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
