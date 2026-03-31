# Phase 6: Gap Filling - Context
**Gathered:** 2026-03-30
**Status:** Ready for planning
<domain>
## Phase Boundary
Generate bridge scenes for accepted gaps. Insert as supplementary pipeline nodes. Use Director's Brief for style consistency. Store gap-fill assets in library with tag.
</domain>
<decisions>
## Implementation Decisions
### Claude's Discretion
All at Claude's discretion. GapFillService (server-side). Uses Replicate API for image generation (install replicate SDK). Prompt built from gap context + Director's Brief. Generated asset saved to Supabase Storage + assets table. New node inserted at correct position. Gap status transitions: fill_requested → generating → filled.
</decisions>
<code_context>
## Existing Code Insights
### Reusable Assets
- Gap store (Phase 5), Pipeline node store (Phase 4), Director's brief store (Phase 2), Supabase client, API patterns
### Integration Points
- Gap detail panel "Auto-Fill" → triggers fill, Generated asset → new pipeline node, Canvas shows new bridge node
</code_context>
<specifics>No specific requirements</specifics>
<deferred>None</deferred>
