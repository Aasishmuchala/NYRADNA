# Phase 2: Director's Cut - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Director's Cut creative brief system. Users provide storyline, tone/visual style, and narrative direction with emotional beats. Brief persists to Supabase. Pipeline gates without completed brief. Creative Director agent analyzes the brief and produces a visible SequencePlan.

This requires: Supabase setup (client install, env config, table migration), brief form UI, Zustand store for brief state, API route for persistence, and agent integration.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion. Key guidelines:

- Install @supabase/supabase-js and @supabase/ssr
- Create Supabase client utility (src/lib/supabase.ts)
- Create director_cuts Supabase table with migration SQL
- Director's Cut page at /create/directors-cut (within existing (auth) route group)
- Add to sidebar createSteps between current steps
- Brief form with sections: Storyline, Visual Style, Narrative Beats
- Zustand store for brief state with Supabase sync
- API route for brief CRUD
- For agent integration: can use OpenAI/Anthropic API call or mock for now
- Follow existing NYRADNA dark theme (#ff9064 orange accent, #0e0e0e background, Material Symbols icons)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Pipeline store from Phase 1 — stage gating, completeStage
- useGatedNavigation hook — for Continue button gating
- Sidebar createSteps array — add Director's Cut step
- Existing page patterns (brief/page.tsx is good reference for form layout)

### Established Patterns
- All pages: 'use client', dark theme, footer with Back/Continue
- Intelligence Feed sidebar on brief page — can reuse for SequencePlan display
- Card-based selection UI (brief page personas)
- Orange accent (#ff9064) for primary actions

### Integration Points
- Sidebar — add Director's Cut step
- Pipeline store — add 'directors-cut' as a stage
- Pipeline types — extend StageId union

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
