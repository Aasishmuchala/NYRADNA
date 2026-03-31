---
phase: 04-pipeline-node-generation
plan: 01
subsystem: api, database
tags: [zustand, supabase, pipeline-nodes, next-api-routes, jsonb]

# Dependency graph
requires:
  - phase: 02-director-s-cut
    provides: DirectorsBrief types, director_cuts table, narrative beats structure
  - phase: 03-asset-set-management
    provides: AssetSet/AssetSetItem types, asset_sets and asset_set_items tables, Zustand store pattern
provides:
  - PipelineNode and NewPipelineNode type definitions
  - pipeline_nodes SQL migration with FKs to asset_sets and asset_set_items
  - usePipelineNodeStore Zustand store with CRUD + generation actions
  - CRUD API route (GET/POST/PUT/DELETE) for pipeline nodes
  - Generate API route that combines asset items with Director's Brief narrative beats
affects: [04-02-pipeline-node-generation, pipeline-visualization, review-stage]

# Tech tracking
tech-stack:
  added: []
  patterns: [generate-route-combines-two-tables, narrative-beat-to-node-mapping, batch-insert-with-position]

key-files:
  created:
    - src/lib/types/pipeline-node.ts
    - supabase/migrations/003_pipeline_nodes.sql
    - src/lib/stores/pipeline-node-store.ts
    - src/app/api/pipeline-nodes/route.ts
    - src/app/api/pipeline-nodes/generate/route.ts
  modified: []

key-decisions:
  - "Generate route reads asset_set_items + director_cuts in sequence, maps beats by position index"
  - "Clean regeneration deletes existing nodes before batch insert for idempotent behavior"
  - "Narrative context stored as JSONB with emotionalTone, transitionFromPrevious, durationHint"

patterns-established:
  - "Generate route pattern: read source tables, map to new rows, batch insert"
  - "JSONB narrative_context field for flexible narrative metadata per node"

requirements-completed: [NODE-01, NODE-02, NODE-03]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 04 Plan 01: Pipeline Node Data Layer Summary

**PipelineNode types, SQL migration, Zustand store with CRUD + auto-generation from asset items and Director's Brief narrative beats**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T18:06:35Z
- **Completed:** 2026-03-30T18:10:55Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Defined PipelineNode, NodeStatus, and NewPipelineNode types with narrativeContext structure
- Created SQL migration with pipeline_nodes table, FKs to asset_sets/asset_set_items, and position index
- Built Zustand store with loadNodes, addNode, removeNode, reorderNodes, updateNodeStatus, and generateFromAssetSet
- Implemented CRUD API route with GET/POST/PUT(reorder)/DELETE and snake_case to camelCase mapping
- Built generate route that reads asset_set_items + director_cuts, maps narrative beats to nodes by position, and batch inserts

## Task Commits

Each task was committed atomically:

1. **Task 1: Define PipelineNode types and create SQL migration** - `a5a1051` (feat)
2. **Task 2: Create pipeline node Zustand store and API routes** - `434d04a` (feat)

## Files Created/Modified
- `src/lib/types/pipeline-node.ts` - PipelineNode, NodeStatus, NewPipelineNode type definitions
- `supabase/migrations/003_pipeline_nodes.sql` - pipeline_nodes table with FKs and indexes
- `src/lib/stores/pipeline-node-store.ts` - Zustand store with CRUD + generation actions
- `src/app/api/pipeline-nodes/route.ts` - GET/POST/PUT/DELETE API route for pipeline nodes
- `src/app/api/pipeline-nodes/generate/route.ts` - POST route to auto-generate nodes from asset set + brief

## Decisions Made
- Generate route reads asset_set_items and director_cuts in sequence, mapping narrative beats to asset items by position index
- Clean regeneration: delete existing nodes before batch insert ensures idempotent behavior on re-generate
- Narrative context stored as JSONB with emotionalTone, transitionFromPrevious, durationHint fields for flexibility
- Default fallback values (neutral tone, cut transition, 3-5s duration) when beats are fewer than items

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PipelineNode types ready for Plan 02's pipeline visualization UI
- SQL migration ready to run against Supabase
- Zustand store provides all state management needed for pipeline node operations
- Generate API endpoint ready to be called from the UI pipeline generation flow

## Self-Check: PASSED

All 5 files verified present. Both task commits (a5a1051, 434d04a) confirmed in git log.

---
*Phase: 04-pipeline-node-generation*
*Completed: 2026-03-30*
