# Phase 8: Asset Feedback Loop - Context
**Gathered:** 2026-03-30
**Status:** Ready for planning
<domain>
## Phase Boundary
All generated videos and gap-fill images automatically appear in the asset library with full provenance metadata. Assets retain links to pipeline node and Director's Brief. Generated assets are reusable in new asset sets or future pipelines.
</domain>
<decisions>
## Implementation Decisions
### Claude's Discretion
All at Claude's discretion. Mostly wiring/polish — gap-fill and video generation already save assets. Ensure metadata completeness (briefId, nodeId, source tag). Asset library page to show provenance badges. Generated assets selectable in asset set picker.
</decisions>
<code_context>
## Existing Code Insights
### Reusable Assets
- Gap fill route (Phase 6) and video gen route (Phase 7) already save to asset_set_items
- Asset set store (Phase 3), Supabase Storage
### Integration Points
- Generated assets → asset library display, Asset library → asset set picker, Pipeline metadata → provenance display
</code_context>
<specifics>No specific requirements</specifics>
<deferred>None</deferred>
