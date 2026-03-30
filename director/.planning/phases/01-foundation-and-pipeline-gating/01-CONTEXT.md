# Phase 1: Foundation and Pipeline Gating - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Install foundational dependencies (Zustand, Supabase client), create the pipeline store with stage gating logic, wire gating into the existing wizard navigation. Users must complete mandatory prerequisite steps before advancing. Freestyle mode (no active pipeline) remains unblocked.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — infrastructure phase. Key guidelines:

- Install `zustand` and `@supabase/supabase-js` + `@supabase/ssr`
- Create pipeline store with the existing 7 steps: intent, brief, style-dna, character-setup, review, generating, export
- Each step has: status (idle/completed/blocked), canSkip flag
- `canExecuteStage(stageId)` pure function — returns false if prior mandatory stages incomplete
- Gate the navigation: existing `createSteps` in Sidebar.tsx show blocked state
- Gate the "GENERATE FILM" button on review page — check prerequisites
- Gate the "CONTINUE" buttons on each step page
- Existing wizard pages use `Link` for navigation — add onClick guards or conditional rendering
- Pipeline state persists to sessionStorage via Zustand persist middleware

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/Sidebar.tsx` — has `createSteps` array defining wizard flow
- `src/app/(auth)/create/review/page.tsx` — has "GENERATE FILM" button (Link to /create/generating)
- `src/app/(auth)/create/brief/page.tsx` — has "CONTINUE" button gated by selection
- All create pages follow same pattern: content + footer with Back/Continue buttons

### Established Patterns
- All pages are client components ('use client')
- Navigation via Next.js `Link` components
- Styling: dark theme, #ff9064 orange accent, #262626 surfaces, Material Symbols icons
- Route group: `(auth)` for authenticated pages

### Integration Points
- Sidebar `createSteps` — add completion indicators + blocked state
- Each create page's footer Continue button — gate with store check
- Review page "GENERATE FILM" — gate with full pipeline check
- No existing state management — Zustand is brand new

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
