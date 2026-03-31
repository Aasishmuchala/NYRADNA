---
phase: 01-foundation-and-pipeline-gating
plan: 02
subsystem: ui
tags: [pipeline-gating, sidebar, navigation, zustand, next.js, hooks]

# Dependency graph
requires:
  - phase: 01-foundation-and-pipeline-gating
    provides: usePipelineStore with canExecuteStage, completeStage, getStageStatus; StageId, STAGE_ORDER, DEFAULT_STAGES types
provides:
  - useGatedNavigation hook for pipeline-aware navigation with blocker detection
  - Pipeline-aware Sidebar with blocked (lock), completed (checkmark), and active (orange) indicators
  - Gated Continue buttons on intent, brief, and style-dna pages via completeStage calls
  - Gated Generate Film button on review page with inline error banner and link to blocking stage
  - Full-page blocked message on brief page for direct URL access when prerequisites incomplete
affects: [01-03, 02-01, pipeline-orchestrator, sidebar-visual-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [useGatedNavigation-hook, hydration-safe-store-reads, onClick-completeStage-then-navigate]

key-files:
  created:
    - src/hooks/useGatedNavigation.ts
  modified:
    - src/components/layout/Sidebar.tsx
    - src/app/(auth)/create/intent/page.tsx
    - src/app/(auth)/create/brief/page.tsx
    - src/app/(auth)/create/style-dna/page.tsx
    - src/app/(auth)/create/review/page.tsx

key-decisions:
  - "Sidebar uses hydration-safe useState+useEffect pattern to prevent SSR mismatch -- defaults to freestyle rendering before hydration"
  - "Blocked sidebar steps rendered as button elements (not Link) with title tooltip showing blocker name"
  - "Brief page shows full-page blocked message for direct URL navigation when gating blocks access"
  - "Review page shows inline error banner below Generate Film button (not a toast) to avoid adding toast library"
  - "All stage completions happen only on explicit user advance (Continue/Generate click), never on page mount"

patterns-established:
  - "useGatedNavigation hook: reusable pattern for any page that needs pipeline-gated navigation"
  - "completeStage-then-navigate: onClick handler calls completeStage then router.push (replaces Link components)"
  - "Hydration safety: useState(false) + useEffect(setTrue) pattern for store-dependent rendering"

requirements-completed: [GATE-03, GATE-04]

# Metrics
duration: 7min
completed: 2026-03-30
---

# Phase 01 Plan 02: UI Gating Integration Summary

**Pipeline-aware Sidebar with lock/checkmark indicators, gated Continue/Generate buttons on all step pages, and useGatedNavigation hook for reusable blocker detection**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T14:42:51Z
- **Completed:** 2026-03-30T14:50:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created useGatedNavigation hook providing canProceed, blockedBy, errorMessage, and navigate for any target stage
- Updated Sidebar to show lock icon with muted styling for blocked stages, green checkmark for completed stages, and orange accent for active stages -- with freestyle mode rendering all steps as plain links
- Wired completeStage into intent, brief, and style-dna Continue buttons so each stage is marked complete on explicit user advance
- Added gated Generate Film button on review page showing inline error banner with direct link to blocking stage (GATE-03)
- Added full-page blocked message on brief page for direct URL navigation when prerequisites are incomplete

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useGatedNavigation hook and update Sidebar with gating indicators** - `9550761` (feat)
2. **Task 2: Gate Continue buttons on step pages and Generate Film button on review page** - `170d796` (feat)

## Files Created/Modified
- `src/hooks/useGatedNavigation.ts` - Reusable hook for pipeline-gated navigation with blocker detection, freestyle mode support, and error messaging
- `src/components/layout/Sidebar.tsx` - Updated with pipeline-aware step rendering: lock for blocked, checkmark for completed, orange for active, hydration-safe
- `src/app/(auth)/create/intent/page.tsx` - Continue button calls completeStage('intent') then navigates to brief
- `src/app/(auth)/create/brief/page.tsx` - Continue button calls completeStage('brief'), full-page blocked message for direct URL access
- `src/app/(auth)/create/style-dna/page.tsx` - Lock Style DNA & Continue calls completeStage('style-dna') then navigates
- `src/app/(auth)/create/review/page.tsx` - Gated Generate Film button with inline error banner showing blocker name and link

## Decisions Made
- Sidebar uses hydration-safe useState+useEffect pattern to prevent SSR mismatch -- defaults to freestyle rendering before hydration
- Blocked sidebar steps rendered as button elements (not Link) with title tooltip showing blocker name -- avoids adding a toast library
- Brief page shows full-page blocked message for direct URL navigation when gating blocks access -- handles users bookmarking or manually entering URLs
- Review page shows inline error banner below Generate Film button (not a modal/toast) for immediate visibility
- All stage completions happen only on explicit user advance (Continue/Generate click), never on page mount -- prevents premature stage completion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All pipeline gating is now visible in the UI -- blocked stages show lock icons, completed stages show checkmarks
- Pipeline store actions (completeStage, canExecuteStage) are wired into all step pages
- useGatedNavigation hook available for any future pages that need gated navigation
- Ready for Plan 01-03 (pipeline orchestrator with auto-advance)
- TypeScript compiles cleanly with no errors

## Self-Check: PASSED

- All 6 key files exist on disk
- All 2 task commits verified in git log (9550761, 170d796)
- TypeScript compiles with zero errors

---
*Phase: 01-foundation-and-pipeline-gating*
*Completed: 2026-03-30*
