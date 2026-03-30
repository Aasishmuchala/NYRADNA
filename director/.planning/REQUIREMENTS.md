# Requirements: NYRADNA Director AI Video Pipeline

**Defined:** 2026-03-30
**Core Value:** Users can produce a seamless, multi-video narrative from modular components through structured, gated AI pipeline generation

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Pipeline Gating

- [ ] **GATE-01**: Pipeline store exposes `canExecuteStage(stageId)` that returns false if any prior mandatory stage is incomplete
- [ ] **GATE-02**: `jumpToStage()` refuses to skip mandatory stages (canSkip=false), returning false instead of silently marking them skipped
- [ ] **GATE-03**: Generate button on Create page checks `canExecuteStage('create')` and shows actionable error with link to incomplete stage when blocked
- [ ] **GATE-04**: Pipeline stage card shows blocked state with "Complete [stage] first" message and navigation link when prerequisites are incomplete
- [ ] **GATE-05**: Freestyle generation (no active pipeline run) remains unblocked — `canExecuteStage()` returns true when `currentRun` is null
- [ ] **GATE-06**: Pipeline orchestrator pauses auto-advance at stage boundaries that require user navigation (awaitUserAdvance flag)

### Director's Cut

- [ ] **DIR-01**: Director's Cut page exists as a distinct route (/studio/directors-cut) accessible from sidebar navigation
- [ ] **DIR-02**: User can input overall storyline as structured text (title, synopsis, theme)
- [ ] **DIR-03**: User can specify tone and visual style (mood, color palette, cinematography references)
- [ ] **DIR-04**: User can define narrative direction with key transitions and emotional beats per segment
- [ ] **DIR-05**: Director's Brief is persisted to Supabase (director_cuts table) and survives page refresh
- [ ] **DIR-06**: Director's Cut stage gates pipeline — pipeline cannot proceed to node generation without a completed brief
- [ ] **DIR-07**: Creative Director agent analyzes the brief and produces a SequencePlan visible to the user

### Asset Initialization

- [ ] **ASSET-01**: User can create an "asset set" — a named collection of assets representing narrative segments
- [ ] **ASSET-02**: User can add existing assets from the asset library to an asset set
- [ ] **ASSET-03**: User can upload new assets directly into an asset set
- [ ] **ASSET-04**: User can reorder assets within a set to define narrative sequence
- [ ] **ASSET-05**: Asset sets are persisted to Supabase and linked to a project

### Pipeline Node Generation

- [ ] **NODE-01**: System auto-generates N pipeline nodes from an asset set of N items
- [ ] **NODE-02**: Each node represents a single video segment linked to its source asset
- [ ] **NODE-03**: Nodes connect sequentially to form the narrative flow defined in the Director's Brief
- [ ] **NODE-04**: Pipeline visualization shows all nodes with their status, connections, and associated assets
- [ ] **NODE-05**: User can manually add, remove, or reorder nodes before generation

### Gap Detection

- [ ] **GAP-01**: After pipeline node creation, system analyzes adjacent nodes for narrative gaps
- [ ] **GAP-02**: Gap detection identifies visual discontinuity (style, color, composition drift between segments)
- [ ] **GAP-03**: Gap detection identifies narrative discontinuity (missing story beats, abrupt transitions)
- [ ] **GAP-04**: Detected gaps are displayed to user with severity (critical, moderate, minor) and type
- [ ] **GAP-05**: User can accept, dismiss, or request auto-fill for each detected gap

### Gap Filling

- [ ] **FILL-01**: System generates supporting images or bridge scenes for accepted gaps
- [ ] **FILL-02**: Gap-fill assets are inserted as supplementary nodes in the pipeline at the correct position
- [ ] **FILL-03**: Gap-fill generation uses Director's Brief context for style/tone consistency
- [ ] **FILL-04**: All gap-fill generated assets are stored back in the asset library with "gap-fill" tag

### AI Video Generation

- [ ] **GEN-01**: Generate stage produces a video for each pipeline node using the node's asset + Director's Brief context
- [ ] **GEN-02**: Generation uses reference images from prior segments to maintain visual consistency
- [ ] **GEN-03**: Generation proceeds sequentially or in configurable batches (max 3 concurrent) to manage credits
- [ ] **GEN-04**: Generation progress is visible per-node in the pipeline visualization
- [ ] **GEN-05**: Completed videos are stored as assets in the asset library with pipeline metadata

### Asset Feedback Loop

- [ ] **LOOP-01**: All generated videos (including gap-fills) automatically appear in the asset library
- [ ] **LOOP-02**: Generated assets retain metadata linking them to their pipeline node and Director's Brief
- [ ] **LOOP-03**: Generated assets are reusable — can be added to new asset sets or future pipelines

### Narrative Validation

- [ ] **NAR-01**: After all nodes are generated, system performs narrative coherence check across the full sequence
- [ ] **NAR-02**: Validation flags inconsistencies in visual style, pacing, or story flow
- [ ] **NAR-03**: User can regenerate individual nodes or accept the sequence as final

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Advanced Pipeline

- **ADV-01**: Complex branching pipelines with if/else nodes and merge points
- **ADV-02**: Audio/music track generation synchronized to video segments
- **ADV-03**: Real-time collaborative pipeline editing with conflict resolution

### Enhanced Generation

- **EGEN-01**: Custom model fine-tuning on user's visual style
- **EGEN-02**: Automated A/B testing of generation parameters per node
- **EGEN-03**: Timeline editor for manual compositing of generated segments

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Massive complexity (CRDTs), single-user sufficient for v1 |
| Custom model training | Runway Gen-4 References + prompting handles consistency |
| Audio generation | Video-only focus, doubles complexity |
| Manual video editing | Pipeline produces final output, no NLE needed |
| Mobile app | Web-first platform |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GATE-01 | Phase 1 | Pending |
| GATE-02 | Phase 1 | Pending |
| GATE-03 | Phase 1 | Pending |
| GATE-04 | Phase 1 | Pending |
| GATE-05 | Phase 1 | Pending |
| GATE-06 | Phase 1 | Pending |
| DIR-01 | Phase 2 | Pending |
| DIR-02 | Phase 2 | Pending |
| DIR-03 | Phase 2 | Pending |
| DIR-04 | Phase 2 | Pending |
| DIR-05 | Phase 2 | Pending |
| DIR-06 | Phase 2 | Pending |
| DIR-07 | Phase 2 | Pending |
| ASSET-01 | Phase 3 | Pending |
| ASSET-02 | Phase 3 | Pending |
| ASSET-03 | Phase 3 | Pending |
| ASSET-04 | Phase 3 | Pending |
| ASSET-05 | Phase 3 | Pending |
| NODE-01 | Phase 4 | Pending |
| NODE-02 | Phase 4 | Pending |
| NODE-03 | Phase 4 | Pending |
| NODE-04 | Phase 4 | Pending |
| NODE-05 | Phase 4 | Pending |
| GAP-01 | Phase 5 | Pending |
| GAP-02 | Phase 5 | Pending |
| GAP-03 | Phase 5 | Pending |
| GAP-04 | Phase 5 | Pending |
| GAP-05 | Phase 5 | Pending |
| FILL-01 | Phase 6 | Pending |
| FILL-02 | Phase 6 | Pending |
| FILL-03 | Phase 6 | Pending |
| FILL-04 | Phase 6 | Pending |
| GEN-01 | Phase 7 | Pending |
| GEN-02 | Phase 7 | Pending |
| GEN-03 | Phase 7 | Pending |
| GEN-04 | Phase 7 | Pending |
| GEN-05 | Phase 7 | Pending |
| LOOP-01 | Phase 8 | Pending |
| LOOP-02 | Phase 8 | Pending |
| LOOP-03 | Phase 8 | Pending |
| NAR-01 | Phase 9 | Pending |
| NAR-02 | Phase 9 | Pending |
| NAR-03 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
