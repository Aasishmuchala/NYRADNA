# Phase 4: Pipeline Node Generation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary
Auto-generate N pipeline nodes from an asset set of N items. Each node = single video segment linked to source asset. Nodes connect sequentially per Director's Brief. Pipeline visualization with @xyflow/react. User can add/remove/reorder nodes.
</domain>

<decisions>
## Implementation Decisions
### Claude's Discretion
All at Claude's discretion. Install @xyflow/react. New Supabase table pipeline_nodes. Zustand store. API routes. SegmentNode component for canvas. Generate Pipeline button in asset set UI. Map Director's Brief narrative beats to nodes.
</decisions>

<code_context>
## Existing Code Insights
### Reusable Assets
- Asset set store (Phase 3), Director's brief store (Phase 2), Pipeline store (Phase 1)
- Supabase client, API route patterns established
### Integration Points
- Asset sets → nodes, Director's Brief → node narrative context, Gap detection (Phase 5) consumes nodes
</code_context>

<specifics>
No specific requirements
</specifics>
<deferred>
None
</deferred>
