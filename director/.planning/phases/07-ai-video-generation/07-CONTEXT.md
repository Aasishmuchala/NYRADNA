# Phase 7: AI Video Generation - Context
**Gathered:** 2026-03-30
**Status:** Ready for planning
<domain>
## Phase Boundary
Produce video for each pipeline node using source asset + Director's Brief context. Reference images from prior segments for visual consistency. Sequential or batched generation (max 3 concurrent). Per-node progress visible. Completed videos stored as assets.
</domain>
<decisions>
## Implementation Decisions
### Claude's Discretion
All at Claude's discretion. VideoGenerationService using Replicate API (already installed in Phase 6). Prompt from node asset + Director's Brief style/tone. Reference images from prior completed nodes. Batch processing with configurable concurrency. Per-node status updates on canvas. Generated videos saved to Supabase Storage + assets.
</decisions>
<code_context>
## Existing Code Insights
### Reusable Assets
- Replicate SDK (Phase 6), Pipeline node store (Phase 4), Director's brief store (Phase 2), Gap fill route pattern (Phase 6), Supabase client + Storage
### Integration Points
- Pipeline nodes → video generation, Director's Brief → prompts, Generated videos → asset library (Phase 8), Canvas → progress display
</code_context>
<specifics>No specific requirements</specifics>
<deferred>None</deferred>
