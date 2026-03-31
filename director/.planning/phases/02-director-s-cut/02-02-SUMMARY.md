---
phase: 02-director-s-cut
plan: 02
subsystem: ui, api, state-management
tags: [zustand, supabase, next-api-routes, react-forms, directors-brief, pipeline]

# Dependency graph
requires:
  - phase: 02-director-s-cut
    plan: 01
    provides: Supabase client factory, DirectorsBrief type system, directors-cut pipeline stage, isBriefComplete validator
  - phase: 01-foundation-and-pipeline-gating
    provides: Pipeline store (completeStage), useGatedNavigation hook, Sidebar navigation
provides:
  - useDirectorsBriefStore Zustand store with full form mutation API and Supabase sync
  - GET/POST /api/briefs API route for brief CRUD with Supabase server client
  - Director's Cut form page at /create/directors-cut with 3 sections and Intelligence Feed
affects: [02-director-s-cut, style-dna, creative-director-agent, sequence-plan]

# Tech tracking
tech-stack:
  added: []
  patterns: [Zustand store with async fetch persistence (no localStorage middleware), Server-side Supabase via createServerClient with async cookies, Chip-based input pattern for array fields]

key-files:
  created:
    - src/lib/stores/directors-brief-store.ts
    - src/app/api/briefs/route.ts
    - src/app/(auth)/create/directors-cut/page.tsx
  modified: []

key-decisions:
  - "Zustand store uses fetch-based persistence (not zustand/persist middleware) because data lives in Supabase, not localStorage"
  - "API route uses createServerClient from @supabase/ssr with async cookies() for Next.js 16 compatibility"
  - "Brief initializes blank on 404 or network error so form is always usable even without Supabase connection"
  - "Color palette swatches attempt to render backgroundColor from user input (hex or named colors)"

patterns-established:
  - "Directors Brief store pattern: Zustand + fetch /api/* for server persistence"
  - "Chip input pattern: array fields shown as removable chips with add input below"
  - "API route pattern: snake_case DB columns mapped to camelCase TypeScript types via mapRowToBrief"
  - "Intelligence Feed sidebar: live form summary updating as user fills fields"

requirements-completed: [DIR-02, DIR-03, DIR-04, DIR-05]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 02 Plan 02: Director's Cut Form, Store & API Summary

**Director's Cut form page with Storyline/Visual Style/Narrative Beats sections, Zustand brief store with Supabase sync, and GET/POST API route for brief persistence**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T17:10:11Z
- **Completed:** 2026-03-30T17:14:02Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created Zustand store with full form mutation API: updateStoryline, updateVisualStyle, addColorToPalette, removeColorFromPalette, addCinematographyRef, removeCinematographyRef, addBeat, updateBeat, removeBeat, loadBrief, saveBrief
- Built Next.js API route at /api/briefs with GET (load by projectId) and POST (upsert) using server-side Supabase client with proper snake_case/camelCase mapping
- Delivered Director's Cut form page with 3 sections, Intelligence Feed sidebar, gated navigation, pipeline stage completion, and dark theme matching existing pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create directors-brief Zustand store with Supabase sync** - `9f53786` (feat)
2. **Task 2: Create API route for brief persistence** - `d2ab482` (feat)
3. **Task 3: Build Director's Cut form page with 3 sections and pipeline wiring** - `efaa326` (feat)

## Files Created/Modified
- `src/lib/stores/directors-brief-store.ts` - Zustand store for brief form state with loadBrief/saveBrief fetching /api/briefs
- `src/app/api/briefs/route.ts` - GET and POST API handlers with server-side Supabase client, snake_case mapping
- `src/app/(auth)/create/directors-cut/page.tsx` - Director's Cut form page with 3 form sections, Intelligence Feed sidebar, gating

## Decisions Made
- Used fetch-based persistence instead of zustand/persist middleware since brief data lives in Supabase, not localStorage -- avoids stale data conflicts
- API route uses `createServerClient` from `@supabase/ssr` with `await cookies()` for Next.js 16 async cookies API
- Brief initializes as blank on 404 or network error so the form remains usable even without Supabase connection (graceful degradation)
- Color palette renders backgroundColor from user input, supporting both hex codes and CSS color names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - Supabase environment variables and table migration were configured in Plan 01. The API route and store use the existing Supabase configuration.

## Next Phase Readiness
- Director's Cut form is fully functional and persists to Supabase
- Brief data flows through: form page -> Zustand store -> /api/briefs -> Supabase director_cuts table
- Pipeline stage 'directors-cut' completes on Continue, unlocking downstream stages
- Ready for Plan 03: Creative Director agent integration to analyze the brief
- All TypeScript clean, Next.js build passes, no regressions

## Self-Check: PASSED

All 3 files verified present. All 3 commit hashes found in git log.

---
*Phase: 02-director-s-cut*
*Completed: 2026-03-30*
