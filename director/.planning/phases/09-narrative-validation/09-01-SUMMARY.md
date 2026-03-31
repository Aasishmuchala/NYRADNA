---
phase: 09-narrative-validation
plan: 01
subsystem: api, database, state
tags: [zustand, supabase, openai, narrative-validation, heuristic-analysis, dual-mode]

# Dependency graph
requires:
  - phase: 05-gap-detection
    provides: dual-mode analysis pattern (heuristic + AI), gap store pattern, CRUD route pattern
  - phase: 04-pipeline-generation
    provides: pipeline_nodes table, PipelineNode type, node position ordering
provides:
  - ValidationIssue, ValidationReport, NewValidationIssue types
  - narrative_validations SQL table with FK to pipeline_nodes
  - useValidationStore Zustand store with load, validate, accept, markRegenerated actions
  - CRUD API route (GET/PUT/DELETE) for narrative validations
  - Dual-mode validate API with heuristic default and AI when OPENAI_API_KEY set
affects: [09-narrative-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: [full-sequence heuristic analysis, tone-contrast detection, dual-mode narrative validation]

key-files:
  created:
    - src/lib/types/narrative-validation.ts
    - supabase/migrations/007_narrative_validation.sql
    - src/lib/stores/validation-store.ts
    - src/app/api/narrative-validation/route.ts
    - src/app/api/narrative-validation/validate/route.ts
  modified: []

key-decisions:
  - "Tone contrast detection uses grouped word pairs for emotional shift detection"
  - "Heuristic checks all three categories: visual-style (bridge/monotony), pacing (transition variety/long segments), story-flow (opening/jarring shifts/resolution)"
  - "Clean re-analysis pattern: delete existing issues before batch insert for idempotent behavior"
  - "All-nodes-completed precondition enforced at API level with 400 response (NAR-01)"

patterns-established:
  - "Full-sequence heuristic validation: analyzes entire node sequence (not just pairs) for coherence issues"
  - "Tone contrast detection: grouped word pairs check emotional shifts between consecutive nodes"
  - "Conclusive keyword detection: checks final node tone for resolution indicators"

requirements-completed: [NAR-01, NAR-02]

# Metrics
duration: 6min
completed: 2026-03-30
---

# Phase 9 Plan 1: Narrative Validation Data Layer Summary

**Dual-mode (heuristic + AI) narrative validation with full-sequence coherence analysis for visual-style, pacing, and story-flow issues**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-30T20:18:20Z
- **Completed:** 2026-03-30T20:24:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Defined ValidationIssue/ValidationReport types with IssueCategory (visual-style, pacing, story-flow) and IssueSeverity
- Created narrative_validations SQL table with CHECK constraints, FK to pipeline_nodes, and indexes
- Built useValidationStore Zustand store with load, validate, accept, acceptAll, and markRegenerated actions
- Implemented dual-mode validate API: heuristic default detects bridge style drift, visual monotony, pacing issues, opening transitions, jarring emotional shifts, and missing resolution; AI mode via OpenAI gpt-4o-mini with automatic fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Define NarrativeValidation types and create SQL migration** - `1b25b47` (feat)
2. **Task 2: Create validation Zustand store and dual-mode API routes** - `e89bf5c` (feat)

## Files Created/Modified
- `src/lib/types/narrative-validation.ts` - IssueCategory, IssueSeverity, ValidationStatus, ValidationIssue, NewValidationIssue, ValidationReport types
- `supabase/migrations/007_narrative_validation.sql` - narrative_validations table with CHECK constraints and indexes
- `src/lib/stores/validation-store.ts` - Zustand store for validation state and actions
- `src/app/api/narrative-validation/route.ts` - CRUD route (GET/PUT/DELETE) with node-position sorting
- `src/app/api/narrative-validation/validate/route.ts` - Dual-mode analysis endpoint with heuristic default and AI fallback

## Decisions Made
- Tone contrast detection uses grouped word pairs (joy/happy/uplifting/energetic/bright vs dark/somber/tragic/melancholic/gloomy) for emotional shift detection
- Heuristic checks all three NAR-02 categories: visual-style (bridge scenes, monotony), pacing (transition variety, long segments), story-flow (opening transition, jarring shifts, resolution)
- Clean re-analysis pattern (delete before insert) matches gap-analysis idempotent behavior
- All-nodes-completed precondition enforced at API level returning 400 with incomplete node positions (NAR-01)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Validation data layer complete, ready for Phase 9 Plan 2 (validation UI components)
- Store exposes all actions needed for UI integration: loadIssues, runValidation, acceptIssue, acceptAll, markRegenerated
- API routes follow established patterns for seamless integration

## Self-Check: PASSED

All 5 created files verified present. Both task commits (1b25b47, e89bf5c) verified in git log.

---
*Phase: 09-narrative-validation*
*Completed: 2026-03-30*
