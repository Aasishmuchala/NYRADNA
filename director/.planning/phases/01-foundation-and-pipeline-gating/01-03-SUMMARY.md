---
phase: 01-foundation-and-pipeline-gating
plan: 03
subsystem: pipeline-orchestration
tags: [pipeline, orchestrator, auto-advance, awaitUserAdvance, zustand, react-hook, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation-and-pipeline-gating
    plan: 01
    provides: usePipelineStore with completeStage, jumpToStage, canExecuteStage, getStage; PipelineStage type with awaitUserAdvance flag; STAGE_ORDER constant
provides:
  - PipelineOrchestrator class with advanceToNext, advanceUserBoundary, isPausedAtBoundary, getCurrentStageId
  - usePipelineOrchestrator React hook wrapping orchestrator for component use
  - Auto-advance through canSkip stages, pausing at awaitUserAdvance boundaries (GATE-06)
affects: [02-01, stage-navigation, pipeline-ui, generate-button, review-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-getState-outside-react, orchestrator-class-pattern, pre-check-before-state-mutation]

key-files:
  created:
    - src/lib/pipeline/orchestrator.ts
    - src/lib/pipeline/__tests__/orchestrator.test.ts
    - src/hooks/usePipelineOrchestrator.ts
  modified: []

key-decisions:
  - "advanceToNext stops at mandatory (canSkip=false) stages requiring user work, not just awaitUserAdvance boundaries"
  - "wouldBeExecutable pre-check simulates canExecuteStage before completing current stage to prevent irreversible state changes"
  - "Orchestrator is a plain class using usePipelineStore.getState() (standard Zustand pattern for non-React code)"
  - "usePipelineOrchestrator hook computes isPausedAtBoundary reactively from store state for component re-rendering"

patterns-established:
  - "Orchestrator class pattern: plain class reads/mutates Zustand store via getState() for use outside React components"
  - "Pre-check pattern: wouldBeExecutable simulates post-mutation state to decide whether to proceed with mutation"
  - "Hook wrapper pattern: useMemo for stable class instance, useCallback for stable method references, reactive store selectors for re-rendering"

requirements-completed: [GATE-06]

# Metrics
duration: 5min
completed: 2026-03-30
---

# Phase 01 Plan 03: Pipeline Orchestrator Summary

**PipelineOrchestrator with auto-advance through canSkip stages, awaitUserAdvance boundary pausing, and React hook wrapper -- 16 passing tests via TDD**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T14:42:55Z
- **Completed:** 2026-03-30T14:48:06Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- PipelineOrchestrator class that auto-advances through canSkip stages and stops at mandatory or awaitUserAdvance stages
- advanceUserBoundary enables explicit user confirmation to pass awaitUserAdvance boundaries (GATE-06 core requirement)
- wouldBeExecutable pre-check prevents irreversible state mutations when next stage would be blocked
- usePipelineOrchestrator React hook provides clean API (advanceToNext, advanceUserBoundary, isPausedAtBoundary, startRun, resetRun) for component use
- Full TDD cycle: 16 orchestrator tests including a complete GATE-06 walkthrough scenario

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for PipelineOrchestrator** - `e98d41d` (test)
2. **Task 1 GREEN: Implement PipelineOrchestrator with auto-advance** - `5317789` (feat)
3. **Task 2: Create usePipelineOrchestrator React hook** - `5aeab7b` (feat)

_Note: Task 1 followed TDD with separate RED and GREEN commits_

## Files Created/Modified
- `src/lib/pipeline/orchestrator.ts` - PipelineOrchestrator class: advanceToNext, advanceUserBoundary, isPausedAtBoundary, getCurrentStageId, wouldBeExecutable
- `src/lib/pipeline/__tests__/orchestrator.test.ts` - 16 unit tests covering all orchestrator behaviors and GATE-06 walkthrough (271 lines)
- `src/hooks/usePipelineOrchestrator.ts` - React hook wrapping orchestrator with reactive store subscriptions (72 lines)

## Decisions Made
- advanceToNext stops at mandatory (canSkip=false) stages in addition to awaitUserAdvance boundaries -- mandatory stages like brief require user work and should not be auto-skipped
- wouldBeExecutable pre-check simulates post-completion state before calling completeStage -- prevents irreversible state mutation when next stage would be blocked by unmet prerequisites
- Orchestrator uses usePipelineStore.getState() (not the hook form) because it is a plain class, not a React component -- this is the standard Zustand pattern for state access outside React
- isPausedAtBoundary is computed reactively in the hook from store state (via useMemo on currentRun) rather than calling orchestrator.isPausedAtBoundary() imperatively, ensuring component re-renders

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] advanceToNext auto-advancing through mandatory stages**
- **Found during:** Task 1 GREEN (implementation)
- **Issue:** Initial implementation auto-advanced through ALL non-awaitUserAdvance stages including mandatory ones (brief), causing advanceToNext from intent to skip all the way to review
- **Fix:** Added check: if the next stage is mandatory (canSkip=false) and does not have awaitUserAdvance, stop there -- it requires user work
- **Files modified:** src/lib/pipeline/orchestrator.ts
- **Verification:** All 16 tests pass, including intent->brief stopping correctly
- **Committed in:** 5317789 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in initial approach)
**Impact on plan:** Necessary correction to auto-advance semantics. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pipeline orchestrator ready for integration into stage navigation components
- usePipelineOrchestrator hook ready for use in page components (advance on Continue click, boundary detection for UI states)
- All 37 tests pass (16 orchestrator + 21 store) with no regressions
- Build passes cleanly with no type errors
- Phase 01 foundation complete: types, store, sidebar gating, and orchestrator all delivered

---
*Phase: 01-foundation-and-pipeline-gating*
*Completed: 2026-03-30*
