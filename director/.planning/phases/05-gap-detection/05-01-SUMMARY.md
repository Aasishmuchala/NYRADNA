---
phase: 05-gap-detection
plan: 01
subsystem: api, database
tags: [zustand, supabase, gap-detection, heuristic-analysis, openai, pipeline]

# Dependency graph
requires:
  - phase: 04-pipeline-node-generation
    provides: pipeline_nodes table and PipelineNode types for FK references and node pair analysis
provides:
  - PipelineGap and NewPipelineGap type definitions with GapType, GapSeverity, GapStatus
  - pipeline_gaps SQL migration with FKs to pipeline_nodes
  - useGapStore Zustand store for gap CRUD and analysis triggers
  - CRUD API at /api/pipeline-gaps (GET/PUT/DELETE)
  - Analyze API at /api/pipeline-gaps/analyze (POST) with dual-mode heuristic/AI detection
affects: [05-gap-detection, 06-fill-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [heuristic gap analysis with AI fallback, dual-mode analyze endpoint]

key-files:
  created:
    - src/lib/types/pipeline-gap.ts
    - supabase/migrations/004_pipeline_gaps.sql
    - src/lib/stores/gap-store.ts
    - src/app/api/pipeline-gaps/route.ts
    - src/app/api/pipeline-gaps/analyze/route.ts
  modified: []

key-decisions:
  - "Heuristic gap analysis as default dev mode -- deterministic detection without API key"
  - "Dual-mode analyze endpoint: heuristic by default, AI-powered when OPENAI_API_KEY set"
  - "Clean re-analysis deletes existing gaps before batch insert for idempotent behavior"
  - "Gap ordering by source node position via join with pipeline_nodes table"

patterns-established:
  - "Heuristic pair analysis: iterate adjacent nodes, detect narrative/visual gaps per pair"
  - "Gap status lifecycle: detected -> accepted/dismissed/fill-requested via PUT"

requirements-completed: [GAP-01, GAP-02, GAP-03, GAP-04]

# Metrics
duration: 6min
completed: 2026-03-30
---

# Phase 05 Plan 01: Gap Detection Data Layer Summary

**PipelineGap types, SQL migration, Zustand store, and dual-mode API for detecting narrative and visual gaps between adjacent pipeline nodes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-30T18:36:57Z
- **Completed:** 2026-03-30T18:43:25Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PipelineGap type system with GapType (visual|narrative), GapSeverity (critical|moderate|minor), GapStatus (detected|accepted|dismissed|fill-requested)
- pipeline_gaps SQL table with FKs to pipeline_nodes, CHECK constraints, and composite indexes
- useGapStore Zustand store with loadGaps, analyzeGaps, updateGapStatus, acceptGap, dismissGap, requestFill actions
- Heuristic gap detection analyzing emotional shifts, repetitive tones, missing midpoint pivots, thumbnail gaps, and cross-asset visual continuity
- AI-powered analysis mode using OpenAI gpt-4o-mini with automatic fallback to heuristic on failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Define PipelineGap types and create SQL migration** - `11b2268` (feat)
2. **Task 2: Create gap Zustand store and API routes (CRUD + analyze)** - `4202ac7` (feat)

## Files Created/Modified
- `src/lib/types/pipeline-gap.ts` - PipelineGap, NewPipelineGap, GapType, GapSeverity, GapStatus type definitions
- `supabase/migrations/004_pipeline_gaps.sql` - pipeline_gaps table with FKs, CHECK constraints, indexes
- `src/lib/stores/gap-store.ts` - Zustand store for gap state management and API interactions
- `src/app/api/pipeline-gaps/route.ts` - GET/PUT/DELETE CRUD API for pipeline gaps
- `src/app/api/pipeline-gaps/analyze/route.ts` - POST analyze route with heuristic + AI dual-mode gap detection

## Decisions Made
- Heuristic gap analysis as default development mode -- deterministic detection runs without any API key, matching the pattern established in Phase 02 for briefs/analyze
- Dual-mode analyze endpoint: heuristic by default, AI-powered when OPENAI_API_KEY environment variable is set, with automatic fallback to heuristic on AI failure
- Clean re-analysis pattern: delete existing gaps before batch insert ensures idempotent behavior (same pattern as pipeline node generation)
- Gap ordering by source node position: GET endpoint joins with pipeline_nodes to sort gaps by their source node's position in the sequence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap data layer complete, ready for Plan 02 (UI components for gap visualization)
- useGapStore provides all actions needed for UI integration: loading, analysis trigger, status management
- Heuristic mode ensures development works without external API dependencies

## Self-Check: PASSED

All 6 files verified present. Both task commits (11b2268, 4202ac7) verified in git log.

---
*Phase: 05-gap-detection*
*Completed: 2026-03-30*
