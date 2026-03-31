---
phase: 09-narrative-validation
plan: 02
subsystem: ui
tags: [react, reactflow, zustand, validation, pipeline]

# Dependency graph
requires:
  - phase: 09-narrative-validation-01
    provides: validation-store, validation types, narrative-validation API routes, heuristic validation engine
  - phase: 07-ai-video-generation
    provides: generateSingleVideo, videoGenerating state, pipeline-nodes generate-video route
provides:
  - Per-node validation flag indicators on SegmentNode with severity coloring
  - ValidationReportPanel side panel with grouped issues and per-issue accept/regenerate actions
  - Full validation workflow in pipeline page (Validate -> View Report -> Regenerate -> Accept Sequence)
  - Single-node status update API endpoint (PUT /api/pipeline-nodes?id=<nodeId>)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [validation-flag-on-node, side-panel-report, per-node-regeneration-flow]

key-files:
  created:
    - src/components/pipeline/ValidationReportPanel.tsx
  modified:
    - src/components/pipeline/SegmentNode.tsx
    - src/components/pipeline/PipelineCanvas.tsx
    - src/app/(auth)/create/pipeline/page.tsx
    - src/app/api/pipeline-nodes/route.ts

key-decisions:
  - "Single-node status update added to existing PUT /api/pipeline-nodes route with id query param to support regeneration flow"
  - "Regeneration flow marks issues as regenerated before resetting node to pending and triggering video generation"

patterns-established:
  - "Validation flag on SegmentNode: highest severity determines indicator color across all issues for that node"
  - "ValidationReportPanel follows GapDetailPanel pattern: side panel with categorized cards and per-item actions"

requirements-completed: [NAR-01, NAR-02, NAR-03]

# Metrics
duration: 7min
completed: 2026-03-30
---

# Phase 09 Plan 02: Validation UI Summary

**Per-node validation flags on SegmentNode, ValidationReportPanel with categorized issues, and full Validate/Regenerate/Accept Sequence workflow wired into pipeline page**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T20:31:32Z
- **Completed:** 2026-03-30T20:38:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SegmentNode shows per-node validation warning icon with issue count colored by highest severity (critical=red, moderate=amber, minor=yellow)
- ValidationReportPanel groups issues by category (visual-style, pacing, story-flow) with severity badges and per-issue Regenerate/Accept actions
- Pipeline page has complete validation workflow: Validate Sequence -> View Report -> Regenerate flagged nodes -> Accept Sequence
- Regeneration flow resets node to pending via new single-node PUT API, marks issues as regenerated, and triggers single video generation
- Footer shows validation issue count with critical severity highlighting and "Sequence approved" confirmation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add validation flag indicator to SegmentNode and create ValidationReportPanel** - `bfb9712` (feat)
2. **Task 2: Wire validation controls into pipeline page with Validate, Regenerate, and Accept Sequence flow** - `b1e55a3` (feat)

## Files Created/Modified
- `src/components/pipeline/ValidationReportPanel.tsx` - Side panel showing validation issues grouped by category with accept/regenerate actions per issue and Accept All footer
- `src/components/pipeline/SegmentNode.tsx` - Extended with validationIssues prop and warning icon indicator colored by highest severity
- `src/components/pipeline/PipelineCanvas.tsx` - Passes validationIssues through to each SegmentNode via ReactFlow data
- `src/app/(auth)/create/pipeline/page.tsx` - Validate Sequence, View Report, Accept Sequence buttons; validation store integration; regeneration handler
- `src/app/api/pipeline-nodes/route.ts` - PUT route extended with single-node status update support (id query param + status body)

## Decisions Made
- Single-node status update added to existing PUT /api/pipeline-nodes route (id query param branch) rather than creating a new route, keeping the API surface minimal
- Regeneration flow marks issues as regenerated before resetting node to pending, ensuring UI state reflects the transition immediately

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended PUT /api/pipeline-nodes for single-node status update**
- **Found during:** Task 2 (pipeline page wiring)
- **Issue:** Existing PUT route only handled batch reorder (assetSetId + nodeIds). Regeneration flow needs to reset a single node's status to pending via API.
- **Fix:** Added conditional branch: when `id` query param present with `status` in body, update that single node's status. Falls through to existing reorder logic otherwise.
- **Files modified:** src/app/api/pipeline-nodes/route.ts
- **Verification:** TypeScript compiles cleanly, route handles both paths
- **Committed in:** b1e55a3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was explicitly anticipated in the plan instructions. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Narrative validation workflow is complete end-to-end: validate, view report, regenerate flagged nodes, accept sequence
- This is the capstone UI for the NYRADNA Director pipeline -- all 9 phases are now complete
- The full pipeline flow is: Create Director's Cut -> Manage Asset Sets -> Generate Pipeline -> Analyze Gaps -> Fill Gaps -> Generate Videos -> Validate Sequence -> Accept

## Self-Check: PASSED

All 5 files verified present. Both task commits (bfb9712, b1e55a3) verified in git log.

---
*Phase: 09-narrative-validation*
*Completed: 2026-03-30*
