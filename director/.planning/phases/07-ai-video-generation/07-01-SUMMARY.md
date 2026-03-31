---
phase: 07-ai-video-generation
plan: 01
subsystem: api
tags: [replicate, video-generation, zustand, supabase, minimax, pipeline]

# Dependency graph
requires:
  - phase: 06-gap-filling
    provides: Pipeline nodes with gap-fill lifecycle, Replicate integration pattern
  - phase: 04-pipeline-visualization
    provides: PipelineNode type, pipeline-node-store, pipeline-nodes API routes
provides:
  - Video generation API route (POST /api/pipeline-nodes/generate-video)
  - Extended PipelineNode type with videoUrl field
  - GenerationConfig and VideoGenerationResult types
  - SQL migration for video_url column
  - Batch video generation with configurable concurrency (1-3)
  - Generation progress tracking in store
affects: [07-02-PLAN, video-ui, timeline, export]

# Tech tracking
tech-stack:
  added: [minimax/video-01-live (Replicate model)]
  patterns: [image-to-video generation with prompt_image_url, batch processing with Promise.allSettled, generation progress tracking]

key-files:
  created:
    - src/app/api/pipeline-nodes/generate-video/route.ts
    - supabase/migrations/006_video_generation.sql
  modified:
    - src/lib/types/pipeline-node.ts
    - src/lib/stores/pipeline-node-store.ts
    - src/app/api/pipeline-nodes/route.ts
    - src/app/api/pipeline-nodes/generate/route.ts
    - src/app/api/pipeline-gaps/analyze/route.ts
    - src/app/api/pipeline-gaps/fill/route.ts

key-decisions:
  - "minimax/video-01-live model for image-to-video generation via Replicate with prompt_optimizer enabled"
  - "Prior 2 completed nodes used as reference context in prompt for visual consistency (GEN-02)"
  - "Separate videoGenerating state from existing generating to avoid UI conflicts"
  - "generationProgress tracks total/completed/current for real-time UI feedback"

patterns-established:
  - "Video generation: mock placeholder URL as default dev mode, Replicate when REPLICATE_API_TOKEN set"
  - "Batch generation: sequential (one-at-a-time) or batched (Promise.allSettled chunks of batchSize, max 3)"
  - "Error resilience: per-node error recovery without stopping the batch"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-05]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 7 Plan 1: Video Generation Data Layer Summary

**Image-to-video generation pipeline with Replicate minimax model, reference-based prompting, batch concurrency control (max 3), and per-node error recovery**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T19:38:42Z
- **Completed:** 2026-03-30T19:43:33Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended PipelineNode with videoUrl field and created GenerationConfig/VideoGenerationResult types
- Created POST /api/pipeline-nodes/generate-video route with Replicate minimax/video-01-live model (mock default) and reference image support from prior completed nodes
- Extended pipeline-node-store with generateVideos (batch with configurable concurrency), generateSingleVideo, videoGenerating state, and generationProgress tracking
- SQL migration 006_video_generation.sql adds video_url column to pipeline_nodes

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend PipelineNode types and create video generation SQL migration** - `7dd50c4` (feat)
2. **Task 2: Create video generation API route and extend store with batch generation** - `d6bd276` (feat)

## Files Created/Modified
- `src/lib/types/pipeline-node.ts` - Added videoUrl field, GenerationConfig, VideoGenerationResult types
- `supabase/migrations/006_video_generation.sql` - ALTER TABLE adding video_url column
- `src/app/api/pipeline-nodes/generate-video/route.ts` - POST handler for single-node video generation with Replicate and mock modes
- `src/lib/stores/pipeline-node-store.ts` - Extended with generateVideos, generateSingleVideo, videoGenerating, generationProgress
- `src/app/api/pipeline-nodes/route.ts` - Updated mapRowToNode with videoUrl
- `src/app/api/pipeline-nodes/generate/route.ts` - Updated mapRowToNode with videoUrl
- `src/app/api/pipeline-gaps/analyze/route.ts` - Updated mapRowToNode with videoUrl
- `src/app/api/pipeline-gaps/fill/route.ts` - Updated mapRowToNode with videoUrl

## Decisions Made
- Used minimax/video-01-live model for image-to-video generation (supports prompt_image_url for reference image input)
- Prior 2 completed nodes fetched as reference context in generation prompt for visual consistency (GEN-02)
- Separate videoGenerating boolean from existing generating to avoid UI state conflicts between pipeline generation and video generation
- generationProgress with total/completed/current enables real-time progress UI in next plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated all existing mapRowToNode helpers to include videoUrl**
- **Found during:** Task 1
- **Issue:** Adding videoUrl to PipelineNode interface would cause type errors in all 4 existing mapRowToNode functions
- **Fix:** Added `videoUrl: (row.video_url as string) ?? null` to all 4 mapRowToNode helpers
- **Files modified:** pipeline-nodes/route.ts, pipeline-nodes/generate/route.ts, pipeline-gaps/analyze/route.ts, pipeline-gaps/fill/route.ts
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 7dd50c4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for type correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - video generation uses mock mode by default. Set REPLICATE_API_TOKEN to enable real Replicate video generation.

## Next Phase Readiness
- Video generation backend complete, ready for UI integration (07-02)
- Store exposes generateVideos and generateSingleVideo for UI consumption
- generationProgress state ready for progress bar/indicator UI

## Self-Check: PASSED

All created files verified present. All task commits (7dd50c4, d6bd276) verified in git log.

---
*Phase: 07-ai-video-generation*
*Completed: 2026-03-30*
