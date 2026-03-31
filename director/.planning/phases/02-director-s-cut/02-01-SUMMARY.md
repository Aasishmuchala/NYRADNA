---
phase: 02-director-s-cut
plan: 01
subsystem: database, ui, pipeline
tags: [supabase, typescript, zustand, pipeline, directors-brief, sql-migration]

# Dependency graph
requires:
  - phase: 01-foundation-and-pipeline-gating
    provides: Pipeline types (StageId, STAGE_ORDER, DEFAULT_STAGES), Zustand store, Sidebar navigation, useGatedNavigation hook
provides:
  - Supabase browser client factory (createClient)
  - DirectorsBrief type system (Storyline, VisualStyle, NarrativeBeat, NarrativeBeats)
  - isBriefComplete validator function
  - directors-cut pipeline stage (mandatory, canSkip=false)
  - director_cuts SQL migration with JSONB columns
  - Sidebar Director's Cut step with movie_filter icon
affects: [02-director-s-cut, directors-cut-form, directors-cut-persistence, style-dna]

# Tech tracking
tech-stack:
  added: [@supabase/supabase-js, @supabase/ssr]
  patterns: [Supabase browser client via createBrowserClient, JSONB columns for flexible schema, isBriefComplete validation pattern]

key-files:
  created:
    - src/lib/supabase.ts
    - src/lib/types/directors-brief.ts
    - supabase/migrations/001_director_cuts.sql
    - .env.local.example
  modified:
    - package.json
    - src/lib/types/pipeline.ts
    - src/components/layout/Sidebar.tsx
    - src/app/(auth)/create/brief/page.tsx
    - src/lib/stores/__tests__/pipeline-store.test.ts
    - src/lib/pipeline/__tests__/orchestrator.test.ts
    - .gitignore

key-decisions:
  - "Supabase browser client uses @supabase/ssr createBrowserClient for Next.js SSR compatibility"
  - "directors-cut stage is canSkip=false (mandatory gate) -- downstream stages like style-dna require it complete"
  - "DirectorsBrief uses JSONB columns for storyline, visual_style, narrative_beats -- flexible schema evolution"
  - "Updated .gitignore to allow .env.local.example while still ignoring real .env files"

patterns-established:
  - "Supabase client pattern: import createClient from src/lib/supabase.ts"
  - "Creative brief types: Storyline + VisualStyle + NarrativeBeats compose into DirectorsBrief"
  - "Mandatory pipeline stages: canSkip=false stages gate downstream progression"

requirements-completed: [DIR-01, DIR-06]

# Metrics
duration: 15min
completed: 2026-03-30
---

# Phase 02 Plan 01: Supabase + Pipeline Infrastructure Summary

**Supabase client with @supabase/ssr, DirectorsBrief type system with 5 interfaces and isBriefComplete validator, 8-stage pipeline with mandatory directors-cut gate**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-30T16:52:18Z
- **Completed:** 2026-03-30T17:07:51Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Installed Supabase packages and created browser client factory for Next.js with env-driven configuration
- Defined complete DirectorsBrief type system: Storyline, VisualStyle, NarrativeBeat, NarrativeBeats, DirectorsBrief interfaces plus isBriefComplete validator
- Extended pipeline from 7 to 8 stages with mandatory directors-cut after brief, gating all downstream stages
- Updated Sidebar navigation, Brief page Continue routing, and all 37 existing tests to accommodate new stage

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Supabase, create client utility, and define DirectorsBrief types** - `b27a8ac` (feat)
2. **Task 2: Extend pipeline with directors-cut stage and update Sidebar** - `8dffa54` (feat)

## Files Created/Modified
- `src/lib/supabase.ts` - Supabase browser client factory using createBrowserClient
- `src/lib/types/directors-brief.ts` - DirectorsBrief, Storyline, VisualStyle, NarrativeBeat, NarrativeBeats types + isBriefComplete validator
- `supabase/migrations/001_director_cuts.sql` - director_cuts table with UUID PK, JSONB columns, project_id index
- `.env.local.example` - Supabase URL and anon key placeholders
- `package.json` - Added @supabase/supabase-js and @supabase/ssr dependencies
- `src/lib/types/pipeline.ts` - Added directors-cut to StageId, STAGE_ORDER, DEFAULT_STAGES (canSkip=false)
- `src/components/layout/Sidebar.tsx` - Added Director's Cut step and directors-cut to validIds
- `src/app/(auth)/create/brief/page.tsx` - Changed Continue navigation from /create/style-dna to /create/directors-cut
- `src/lib/stores/__tests__/pipeline-store.test.ts` - Updated stage count (7->8) and added directors-cut to completion sequences
- `src/lib/pipeline/__tests__/orchestrator.test.ts` - Updated all completion sequences to include directors-cut
- `.gitignore` - Added !.env.local.example exception

## Decisions Made
- Used @supabase/ssr createBrowserClient (not @supabase/supabase-js directly) for proper Next.js SSR/client hydration
- directors-cut is mandatory (canSkip=false) -- this creates the DIR-06 gating requirement; style-dna and later stages cannot be reached without completing directors-cut
- JSONB columns for storyline, visual_style, narrative_beats allow flexible schema evolution without migrations
- Added .gitignore exception for .env.local.example since .env* glob was catching it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated .gitignore to allow .env.local.example**
- **Found during:** Task 1 (git add .env.local.example)
- **Issue:** .env* glob pattern in .gitignore was rejecting .env.local.example
- **Fix:** Added `!.env.local.example` exception to .gitignore
- **Files modified:** .gitignore
- **Verification:** git add succeeded after fix
- **Committed in:** b27a8ac (Task 1 commit)

**2. [Rule 1 - Bug] Updated orchestrator tests for 8-stage pipeline**
- **Found during:** Task 2 (updating tests)
- **Issue:** Orchestrator tests had completion sequences missing directors-cut, causing test failures due to mandatory gating
- **Fix:** Added directors-cut completion to all test sequences that advance past brief
- **Files modified:** src/lib/pipeline/__tests__/orchestrator.test.ts
- **Verification:** All 37 tests pass
- **Committed in:** 8dffa54 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) will need to be configured in .env.local when Supabase project is created. The .env.local.example file documents the required variables.

## Next Phase Readiness
- Supabase client ready for Director's Cut form persistence (02-02)
- DirectorsBrief types ready for form component binding (02-02)
- Pipeline stage registered -- Director's Cut page route can be created (02-02)
- Migration SQL ready to run when Supabase project is provisioned
- All existing tests pass, no regressions

## Self-Check: PASSED

All files verified present. All commit hashes found in git log.

---
*Phase: 02-director-s-cut*
*Completed: 2026-03-30*
