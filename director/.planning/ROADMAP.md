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
- [ ] **Phase 4: Pipeline Node Generation** - Auto-generate pipeline nodes from asset sets with sequential narrative flow
- [ ] **Phase 5: Gap Detection** - Identify narrative and visual gaps between pipeline nodes
- [ ] **Phase 6: Gap Filling** - Generate bridge scenes and supporting assets for detected gaps
- [ ] **Phase 7: AI Video Generation** - Produce videos per pipeline node with visual consistency
- [ ] **Phase 8: Asset Feedback Loop** - Generated assets flow back into the asset library for reuse
- [ ] **Phase 9: Narrative Validation** - Full-sequence coherence check and final approval workflow

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Pipeline Node Generation
**Goal**: Users see their asset set automatically transformed into a connected pipeline of video nodes that follows the narrative structure from the Director's Brief
**Depends on**: Phase 2, Phase 3
**Requirements**: NODE-01, NODE-02, NODE-03, NODE-04, NODE-05
**Success Criteria** (what must be TRUE):
  1. User with a completed Director's Brief and asset set sees N pipeline nodes auto-generated from N assets, each linked to its source asset
  2. User can view the pipeline visualization showing all nodes with their status, sequential connections, and associated asset thumbnails
  3. User can manually add, remove, or reorder nodes before triggering generation
  4. Nodes reflect the narrative flow defined in the Director's Brief -- the sequence aligns with the creative plan
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Gap Detection
**Goal**: Users receive actionable analysis of narrative and visual gaps between their pipeline nodes before generation starts
**Depends on**: Phase 4
**Requirements**: GAP-01, GAP-02, GAP-03, GAP-04, GAP-05
**Success Criteria** (what must be TRUE):
  1. User sees gap analysis results after pipeline node creation, with each gap showing its type (visual discontinuity or narrative discontinuity) and severity (critical, moderate, minor)
  2. User can distinguish between visual gaps (style/color/composition drift) and narrative gaps (missing story beats, abrupt transitions) in the gap report
  3. User can accept, dismiss, or request auto-fill for each individual detected gap
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Gap Filling
**Goal**: Users can fill detected gaps with AI-generated bridge scenes that maintain stylistic and narrative consistency
**Depends on**: Phase 5
**Requirements**: FILL-01, FILL-02, FILL-03, FILL-04
**Success Criteria** (what must be TRUE):
  1. User who requests auto-fill for a gap sees a generated supporting image or bridge scene inserted as a new node at the correct pipeline position
  2. Generated gap-fill content visually aligns with the Director's Brief style and tone -- it does not look like a foreign insertion
  3. All gap-fill generated assets appear in the asset library tagged as "gap-fill" for easy identification and future reuse
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

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
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Asset Feedback Loop
**Goal**: All generated content flows back into the asset library as first-class reusable assets with full provenance
**Depends on**: Phase 7
**Requirements**: LOOP-01, LOOP-02, LOOP-03
**Success Criteria** (what must be TRUE):
  1. User sees all generated videos (including gap-fills) automatically appear in the asset library without manual import
  2. User can inspect any generated asset and see its provenance -- which pipeline node and Director's Brief produced it
  3. User can add any previously generated asset to a new asset set or future pipeline, completing the creative reuse cycle
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Narrative Validation
**Goal**: Users can verify the coherence of their complete generated sequence and selectively regenerate weak segments before final export
**Depends on**: Phase 7, Phase 8
**Requirements**: NAR-01, NAR-02, NAR-03
**Success Criteria** (what must be TRUE):
  1. User sees a full-sequence narrative coherence report after all nodes finish generating, flagging inconsistencies in visual style, pacing, or story flow
  2. User can regenerate individual nodes that the validation flagged as problematic without re-running the entire pipeline
  3. User can accept the final sequence, marking it as complete and ready for export
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
Note: Phase 3 can execute in parallel with Phase 2 (both depend only on Phase 1). Phase 4 requires both Phase 2 and Phase 3.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Pipeline Gating | 0/3 | Planning complete | - |
| 2. Director's Cut | 0/3 | Planning complete | - |
| 3. Asset Initialization | 0/2 | Not started | - |
| 4. Pipeline Node Generation | 0/2 | Not started | - |
| 5. Gap Detection | 0/2 | Not started | - |
| 6. Gap Filling | 0/2 | Not started | - |
| 7. AI Video Generation | 0/2 | Not started | - |
| 8. Asset Feedback Loop | 0/1 | Not started | - |
| 9. Narrative Validation | 0/1 | Not started | - |
