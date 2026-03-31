---
phase: 06-gap-filling
plan: 01
subsystem: api
tags: [replicate, image-generation, supabase, zustand, gap-fill, pipeline]

# Dependency graph
requires:
  - phase: 05-gap-detection
    provides: pipeline_gaps table, GapStatus types, gap-store with loadGaps/analyzeGaps/requestFill
provides:
  - Extended GapStatus with 'generating' and 'filled' lifecycle states
  - POST /api/pipeline-gaps/fill endpoint for complete gap-fill flow
  - Replicate image generation integration (flux-schnell model)
  - Deterministic mock mode for dev without API key
  - fillGap store action with optimistic updates and error recovery
  - Bridge node and asset insertion with position shifting
affects: [06-gap-filling, pipeline-visualization, asset-sets]

# Tech tracking
tech-stack:
  added: [replicate]
  patterns: [dual-mode-generation, optimistic-store-updates, position-shifting, error-recovery-revert]

key-files:
  created:
    - supabase/migrations/005_gap_fill.sql
    - src/app/api/pipeline-gaps/fill/route.ts
  modified:
    - src/lib/types/pipeline-gap.ts
    - src/lib/stores/gap-store.ts
    - src/app/api/pipeline-gaps/route.ts
    - package.json

key-decisions:
  - "Replicate flux-schnell model for fast bridge scene generation (16:9 aspect ratio)"
  - "Deterministic mock as default dev mode for gap-fill -- no API key needed"
  - "Position shifting from highest to lowest to avoid unique constraint conflicts"
  - "fillGap chains automatically from requestFill for seamless Auto-Fill UX"
  - "Error recovery reverts gap status to fill-requested for retryability"

patterns-established:
  - "Dual-mode generation: Replicate when REPLICATE_API_TOKEN set, mock placeholder otherwise"
  - "Position shifting pattern: fetch descending, update one-by-one to avoid conflicts"
  - "Optimistic store updates with error revert for async operations"

requirements-completed: [FILL-01, FILL-02, FILL-03, FILL-04]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 06 Plan 01: Gap Fill Data Layer Summary

**Complete gap-fill backend: Replicate image generation with mock fallback, bridge node insertion with position shifting, asset creation with gap-fill metadata, and Zustand store action with optimistic updates**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T19:06:17Z
- **Completed:** 2026-03-30T19:14:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended gap status lifecycle to include 'generating' and 'filled' states with SQL migration and TypeScript types
- Built complete POST /api/pipeline-gaps/fill endpoint handling: gap validation, status transitions, Director's Brief context extraction, prompt building, image generation (Replicate/mock), asset insertion with gap-fill metadata, bridge node creation with position shifting, and error recovery
- Installed Replicate SDK and added fillGap store action with optimistic 'generating' state, error revert to 'fill-requested', and automatic chaining from requestFill

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend gap status lifecycle and create fill API route** - `8bb8354` (feat)
2. **Task 2: Install Replicate SDK and update gap store with fillGap action** - `4e1c6b2` (feat)

## Files Created/Modified
- `supabase/migrations/005_gap_fill.sql` - Extends status CHECK constraint, adds fill_node_id FK column
- `src/lib/types/pipeline-gap.ts` - GapStatus extended with 'generating' | 'filled', PipelineGap gains fillNodeId
- `src/app/api/pipeline-gaps/fill/route.ts` - Complete gap-fill API: fetch gap, generate image, insert asset, insert bridge node, shift positions, update gap
- `src/lib/stores/gap-store.ts` - Added filling state, fillGap action with optimistic updates, requestFill chains fillGap
- `src/app/api/pipeline-gaps/route.ts` - mapRowToGap now includes fillNodeId field
- `package.json` - Added replicate dependency

## Decisions Made
- Used Replicate flux-schnell model for bridge scene generation (fast, good quality, 16:9 aspect ratio for video scenes)
- Deterministic mock as default dev mode for gap-fill -- returns placehold.co URL, logs mock message, no API key needed
- Position shifting iterates from highest to lowest position to avoid unique constraint violations during insert
- fillGap chains automatically from requestFill so clicking "Auto-Fill" triggers the complete flow in one action
- Error recovery reverts gap status to fill-requested on any failure after 'generating' was set, ensuring retryability
- Dynamic import of replicate SDK (only loaded when REPLICATE_API_TOKEN present) to avoid bundling in dev mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript errors with Replicate dynamic import and Supabase builder types**
- **Found during:** Task 1 (fill API route creation)
- **Issue:** Three type errors: (a) dynamic import of 'replicate' module without types, (b) .catch() on Supabase RPC PromiseLike, (c) .catch() on Supabase filter builder
- **Fix:** (a) Used typed dynamic import with explicit constructor signature, (b) removed RPC attempt and used direct position-shift approach only, (c) replaced .catch() with try/catch block
- **Files modified:** src/app/api/pipeline-gaps/fill/route.ts
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 8bb8354 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the type errors fixed above.

## User Setup Required
None - mock mode works without any external service configuration. For production image generation, set REPLICATE_API_TOKEN environment variable.

## Next Phase Readiness
- Gap fill data layer complete, ready for Phase 06 Plan 02 (gap-fill UI components)
- Fill API supports both mock and Replicate modes
- Store action provides complete Auto-Fill flow for UI integration

---
*Phase: 06-gap-filling*
*Completed: 2026-03-30*

## Self-Check: PASSED

All 6 files verified present. Both task commits (8bb8354, 4e1c6b2) verified in git log.
