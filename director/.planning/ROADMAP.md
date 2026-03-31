# Roadmap: NYRADNA Director

## Overview

NYRADNA Director transforms from a static mockup into a fully functional AI video pipeline. The journey begins with foundational infrastructure (state management, database, pipeline gating) and progresses through the creative brief system, asset management, pipeline node generation, gap analysis, gap filling, AI video generation, asset reuse, and narrative validation. Each phase delivers one end-to-end capability on top of the previous, culminating in a system where users can produce seamless multi-video narratives from modular components.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Pipeline Gating** - Zustand stores, Supabase setup, and pipeline stage enforcement
- [ ] **Phase 2: Director's Cut** - Creative brief system for storyline, tone, style, and emotional beats
- [ ] **Phase 3: Asset Initialization** - Asset set creation, management, and persistence
- [x] **Phase 4: Pipeline Node Generation** - Auto-generate pipeline nodes from asset sets with sequential narrative flow (completed 2026-03-30)
- [ ] **Phase 5: Gap Detection** - Identify narrative and visual gaps between pipeline nodes
- [ ] **Phase 6: Gap Filling** - Generate bridge scenes and supporting assets for detected gaps
- [ ] **Phase 7: AI Video Generation** - Produce videos per pipeline node with visual consistency
- [ ] **Phase 8: Asset Feedback Loop** - Generated assets flow back into the asset library for reuse
- [ ] **Phase 9: Narrative Validation** - Full-sequence coherence check and final approval workflow
- [ ] **Phase 10: Atlas Cloud Redesign** - Replace orange theme with purple Atlas Cloud aesthetic across all 30 files
- [ ] **Phase 11: Cinematic Luxury Redesign** - Replace Atlas Cloud purple (#7F72F7) with soft lavender (#c6bfff) cinematic palette, glassmorphism, Manrope headlines, spacious layouts

## Phase Details

### Phase 1: Foundation and Pipeline Gating
**Goal**: Users experience an enforced pipeline where wizard steps cannot be skipped or accessed out of order, backed by real state management and database persistence
**Depends on**: Nothing (first phase)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06
**Success Criteria** (what must be TRUE):
  1. User cannot navigate to a later wizard step if a prior mandatory step is incomplete -- the UI shows a blocked state with a message linking to the incomplete step
  2. User clicking the Generate button on the Create page sees an actionable error when prerequisites are missing, not a silent failure
  3. User in freestyle mode (no active pipeline run) can access all steps without gating restrictions
  4. Pipeline auto-advance pauses at stage boundaries marked for user navigation, waiting for user action before proceeding
  5. Page refresh preserves pipeline state -- the user returns to their current step, not the beginning
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Install Zustand, define pipeline types, create pipeline store with gating logic and tests
- [x] 01-02-PLAN.md — Wire sidebar gating indicators and gate Continue/Generate buttons on step pages
- [x] 01-03-PLAN.md — Create pipeline orchestrator with auto-advance and awaitUserAdvance boundary pausing

### Phase 2: Director's Cut
**Goal**: Users can author a comprehensive creative brief that defines their narrative vision before any generation begins, and this brief gates all downstream pipeline activity
**Depends on**: Phase 1
**Requirements**: DIR-01, DIR-02, DIR-03, DIR-04, DIR-05, DIR-06, DIR-07
**Success Criteria** (what must be TRUE):
  1. User can navigate to /create/directors-cut from the sidebar and fill out storyline (title, synopsis, theme), tone/style (mood, palette, cinematography references), and narrative direction (transitions, emotional beats per segment)
  2. User's Director's Brief persists to Supabase and survives full page refresh without data loss
  3. User cannot proceed to pipeline node generation without a completed Director's Brief -- the pipeline blocks with an actionable message
  4. User can see a SequencePlan produced by the Creative Director agent after submitting their brief, showing how their narrative vision maps to planned segments
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Install Supabase, extend pipeline with directors-cut stage, define DirectorsBrief types and migration SQL
- [x] 02-02-PLAN.md — Build Director's Cut form page with brief store, API persistence, and 3 form sections (storyline, visual style, narrative beats)
- [x] 02-03-PLAN.md — Creative Director agent analysis producing SequencePlan visible in Intelligence Feed

### Phase 3: Asset Initialization
**Goal**: Users can assemble named collections of assets that define the visual building blocks of their narrative
**Depends on**: Phase 1
**Requirements**: ASSET-01, ASSET-02, ASSET-03, ASSET-04, ASSET-05
**Success Criteria** (what must be TRUE):
  1. User can create a named asset set, add existing library assets and upload new assets into it, and reorder assets via drag-and-drop to define narrative sequence
  2. User's asset sets persist to Supabase and remain linked to their project across sessions
  3. User can see all assets within a set displayed in their defined order with thumbnails and metadata
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Define asset set types, SQL migration, Zustand store, and API routes for CRUD + upload
- [x] 03-02-PLAN.md — Install @dnd-kit, build asset set management page with DnD reorder, upload zone, and sidebar nav

### Phase 4: Pipeline Node Generation
**Goal**: Users see their asset set automatically transformed into a connected pipeline of video nodes that follows the narrative structure from the Director's Brief
**Depends on**: Phase 2, Phase 3
**Requirements**: NODE-01, NODE-02, NODE-03, NODE-04, NODE-05
**Success Criteria** (what must be TRUE):
  1. User with a completed Director's Brief and asset set sees N pipeline nodes auto-generated from N assets, each linked to its source asset
  2. User can view the pipeline visualization showing all nodes with their status, sequential connections, and associated asset thumbnails
  3. User can manually add, remove, or reorder nodes before triggering generation
  4. Nodes reflect the narrative flow defined in the Director's Brief -- the sequence aligns with the creative plan
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Define PipelineNode types, SQL migration, Zustand store, and API routes for CRUD + auto-generation from asset set + brief
- [x] 04-02-PLAN.md — Install @xyflow/react, build pipeline canvas with SegmentNode visualization, node CRUD controls, sidebar entry, and generate trigger

### Phase 5: Gap Detection
**Goal**: Users receive actionable analysis of narrative and visual gaps between their pipeline nodes before generation starts
**Depends on**: Phase 4
**Requirements**: GAP-01, GAP-02, GAP-03, GAP-04, GAP-05
**Success Criteria** (what must be TRUE):
  1. User sees gap analysis results after pipeline node creation, with each gap showing its type (visual discontinuity or narrative discontinuity) and severity (critical, moderate, minor)
  2. User can distinguish between visual gaps (style/color/composition drift) and narrative gaps (missing story beats, abrupt transitions) in the gap report
  3. User can accept, dismiss, or request auto-fill for each individual detected gap
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Define PipelineGap types, SQL migration, Zustand gap store, and API routes for CRUD + gap analysis (heuristic + AI dual-mode)
- [x] 05-02-PLAN.md — Build GapMarker edge component, GapDetailPanel with accept/dismiss/fill actions, integrate into pipeline canvas and page

### Phase 6: Gap Filling
**Goal**: Users can fill detected gaps with AI-generated bridge scenes that maintain stylistic and narrative consistency
**Depends on**: Phase 5
**Requirements**: FILL-01, FILL-02, FILL-03, FILL-04
**Success Criteria** (what must be TRUE):
  1. User who requests auto-fill for a gap sees a generated supporting image or bridge scene inserted as a new node at the correct pipeline position
  2. Generated gap-fill content visually aligns with the Director's Brief style and tone -- it does not look like a foreign insertion
  3. All gap-fill generated assets appear in the asset library tagged as "gap-fill" for easy identification and future reuse
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Extend gap status lifecycle, create fill API route with Replicate image generation (mock default), insert bridge nodes and gap-fill assets
- [x] 06-02-PLAN.md — Wire GapDetailPanel fill states, add bridge node visual indicator on canvas, auto-reload pipeline after fill

### Phase 7: AI Video Generation
**Goal**: Users can generate videos for every pipeline node with visual consistency maintained across the full sequence
**Depends on**: Phase 6
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05
**Success Criteria** (what must be TRUE):
  1. User can trigger generation and see a video produced for each pipeline node using that node's asset plus Director's Brief context
  2. User can observe per-node generation progress in the pipeline visualization (queued, generating, complete, failed states)
  3. Generated videos maintain visual consistency across segments -- reference images from prior segments are used during generation
  4. User can configure batch size (up to 3 concurrent) to manage generation credits, with sequential fallback
  5. Completed videos are stored as assets in the asset library with full pipeline metadata (node ID, brief reference, generation params)
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Extend PipelineNode with videoUrl, SQL migration, Replicate video generation API route (mock default), batch generation store action with concurrency control
- [x] 07-02-PLAN.md — Wire Generate Videos button with batch size config, per-node progress on canvas, progress bar, auto-reload after generation

### Phase 8: Asset Feedback Loop
**Goal**: All generated content flows back into the asset library as first-class reusable assets with full provenance
**Depends on**: Phase 7
**Requirements**: LOOP-01, LOOP-02, LOOP-03
**Success Criteria** (what must be TRUE):
  1. User sees all generated videos (including gap-fills) automatically appear in the asset library without manual import
  2. User can inspect any generated asset and see its provenance -- which pipeline node and Director's Brief produced it
  3. User can add any previously generated asset to a new asset set or future pipeline, completing the creative reuse cycle
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md — Enrich generation metadata with briefId, add provenance badges, create Generated Assets panel with add-to-set reuse

### Phase 9: Narrative Validation
**Goal**: Users can verify the coherence of their complete generated sequence and selectively regenerate weak segments before final export
**Depends on**: Phase 7, Phase 8
**Requirements**: NAR-01, NAR-02, NAR-03
**Success Criteria** (what must be TRUE):
  1. User sees a full-sequence narrative coherence report after all nodes finish generating, flagging inconsistencies in visual style, pacing, or story flow
  2. User can regenerate individual nodes that the validation flagged as problematic without re-running the entire pipeline
  3. User can accept the final sequence, marking it as complete and ready for export
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Define NarrativeValidation types, SQL migration, Zustand validation store, and dual-mode (heuristic + AI) validate API route
- [x] 09-02-PLAN.md — Wire validation flags on SegmentNode, ValidationReportPanel, Validate/Accept Sequence buttons, per-node regeneration on pipeline page

### Phase 10: Atlas Cloud Redesign
**Goal**: Every page and component in the app uses the Atlas Cloud purple (#7F72F7) aesthetic instead of the orange (#ff9064) theme, with ultra-dark backgrounds, glassmorphism panels, Inter font, and professional SaaS styling
**Depends on**: Phase 9
**Requirements**: ATLAS-FOUNDATION, ATLAS-LAYOUT, ATLAS-CREATE-PAGES-A, ATLAS-CREATE-PAGES-B, ATLAS-PIPELINE-COMPONENTS, ATLAS-ASSETS-AND-REMAINING
**Success Criteria** (what must be TRUE):
  1. Zero occurrences of #ff9064, #0e0e0e, #262626, #131313, or #adaaaa in any .tsx or .css file
  2. All CSS variables resolve to purple Atlas Cloud palette values
  3. Inter is the only font family (Manrope completely removed)
  4. Sidebar, TopNav, all create/* pages, all pipeline components, all asset components, projects page, and landing page use purple accents
**Plans**: 6 plans

Plans:
- [x] 10-01-PLAN.md — Replace CSS variables, utility classes, and fonts in globals.css, root layout, auth layout
- [x] 10-02-PLAN.md — Restyle Sidebar and TopNav with purple accents and atlas-dark backgrounds
- [ ] 10-03-PLAN.md — Restyle 5 heavy create/* pages (directors-cut, brief, style-dna, character-setup, pipeline)
- [ ] 10-04-PLAN.md — Restyle 5 remaining create/* pages (review, generating, export, asset-sets, intent)
- [ ] 10-05-PLAN.md — Restyle all 6 pipeline components (SegmentNode, PipelineCanvas, GapMarker, GapDetailPanel, NodeControls, ValidationReportPanel)
- [ ] 10-06-PLAN.md — Restyle 4 asset components, projects page, landing page, and full codebase audit

### Phase 11: Cinematic Luxury Redesign
**Goal**: Every page and component uses the cinematic luxury aesthetic with soft lavender (#c6bfff/#8c80ff) palette, glassmorphism (rgba + backdrop-blur), Manrope font-light headlines, spacious layouts, and film-production creative suite feel
**Depends on**: Phase 10
**Requirements**: CIN-FOUNDATION, CIN-NAV, CIN-CREATE-PAGES-A, CIN-CREATE-PAGES-B, CIN-PIPELINE-COMPONENTS, CIN-ASSETS-AND-REMAINING, CIN-AUDIT
**Success Criteria** (what must be TRUE):
  1. Zero occurrences of #7F72F7, #A78BFA, #0A0A0F, #12121A, #1A1A2E, or #A0A0B8 in any .tsx or .css file
  2. All CSS custom properties use the cinematic palette (primary #c6bfff, surface #050507, etc.)
  3. Manrope is the headline font with font-light and tracking-[-0.03em]
  4. Glass-card class uses rgba(255,255,255,0.05) + backdrop-blur(50px) + lavender border
  5. Material Symbols use wght 200 (thin)
  6. All headings use font-light, all labels use text-[10px] tracking-[0.2em+] uppercase font-bold
  7. Sidebar and TopNav use glassmorphism with white-alpha backgrounds
  8. App builds without errors
**Plans**: 7 plans

Plans:
- [x] 11-01-PLAN.md — Rewrite globals.css with cinematic palette, glass-card/cinematic-glow/radial-ambient classes; update root layout fonts and auth layout spacing
- [x] 11-02-PLAN.md — Restyle Sidebar (glass bg, border-r-2 active, wide tracking) and TopNav (glass bg, minimal)
- [ ] 11-03-PLAN.md — Restyle 5 heavy create/* pages (directors-cut, character-setup, generating, review, export)
- [ ] 11-04-PLAN.md — Restyle 5 lighter create/* pages (intent, brief, style-dna, asset-sets, pipeline)
- [ ] 11-05-PLAN.md — Restyle all 14 pipeline components
- [ ] 11-06-PLAN.md — Restyle 4 asset components, Modal, and 6 remaining pages (dashboard, projects, settings, characters, assets, landing)
- [ ] 11-07-PLAN.md — Full codebase audit for old hex values + build verification + visual spot-check

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11
Note: Phase 3 can execute in parallel with Phase 2 (both depend only on Phase 1). Phase 4 requires both Phase 2 and Phase 3.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Pipeline Gating | 0/3 | Planning complete | - |
| 2. Director's Cut | 0/3 | Planning complete | - |
| 3. Asset Initialization | 0/2 | Planning complete | - |
| 4. Pipeline Node Generation | 2/2 | Complete   | 2026-03-30 |
| 5. Gap Detection | 0/2 | Planning complete | - |
| 6. Gap Filling | 0/2 | Planning complete | - |
| 7. AI Video Generation | 0/2 | Planning complete | - |
| 8. Asset Feedback Loop | 0/1 | Planning complete | - |
| 9. Narrative Validation | 0/2 | Planning complete | - |
| 10. Atlas Cloud Redesign | 2/6 | In Progress|  |
| 11. Cinematic Luxury Redesign | 2/7 | In Progress|  |
