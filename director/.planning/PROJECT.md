# NYRADNA Director — AI Video Pipeline System

## What This Is

An AI-powered video creation platform ("Director") that guides users through a structured pipeline to produce multi-scene video narratives. Built with Next.js 16 + React 19 + Tailwind 4. Currently has static mockup pages with hardcoded data — needs real state management, persistence, pipeline gating, Director's Cut creative brief, asset management, gap detection/filling, and AI video generation.

## Core Value

Users can produce a seamless, multi-video narrative from modular components by combining structured storytelling (Director's Cut) with AI-driven generation through an enforced pipeline that ensures prerequisite stages complete before generation begins.

## Requirements

### Validated

- Existing 7-step creation wizard UI (Intent → Brief → Style DNA → Characters → Review → Generate → Export)
- Sidebar navigation with workflow steps
- Scene review page with grid view and CLIP scores
- Generating page with act structure, progress tracking, scene pipeline cards
- Dark theme UI with orange (#ff9064) accent color
- Next.js 16 App Router with (auth) route group

### Active

- [ ] Pipeline stage gating — enforce prerequisite completion before advancing
- [ ] Director's Cut stage — pre-pipeline creative brief (storyline, tone, style, transitions, emotional beats)
- [ ] Asset initialization — select/define asset sets as narrative segments
- [ ] Auto pipeline node generation — N nodes from N assets, sequential story flow
- [ ] Gap detection — identify narrative/visual gaps between pipeline nodes
- [ ] Gap filling — generate supporting images/scenes for smooth transitions
- [ ] Asset feedback loop — generated assets stored back to asset library for reuse
- [ ] AI video generation — produce videos per node using director's input + assets
- [ ] Visual consistency enforcement across generated segments
- [ ] Narrative coherence validation across multi-video output

### Out of Scope

- Real-time collaborative editing — single-user pipeline for now
- Custom model training/fine-tuning — use existing provider models
- Audio/music generation integration — video-only pipeline focus
- Mobile app — web-first platform

## Context

This is a **greenfield-ish** project. The existing codebase has 16 TypeScript files with static mockup pages — no state management (no Zustand/Redux), no backend (no Supabase/API routes), no AI integration. Everything uses hardcoded data arrays. The creation pipeline exists as navigation routes but has no gating, no persistence, and no real generation.

Key aspects:
- ~16 source files, all static React pages with mock data
- No existing stores, agents, or provider integrations
- Uses Material Symbols icons (not Lucide)
- Orange accent (#ff9064) dark theme
- Needs everything built from scratch: state management, API routes, database, AI integration

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Tailwind 4 (existing)
- **State management**: Add Zustand (not installed yet)
- **Database**: Add Supabase (not installed yet)
- **AI providers**: Add Replicate/Runway integration (not installed yet)
- **UI style**: Follow existing dark theme with #ff9064 orange accent, Material Symbols icons
- **No breaking existing pages**: Extend, don't replace existing wizard steps

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Add Zustand for state management | Lightweight, matches project scale, proven pattern | -- Pending |
| Add Supabase for persistence + auth | Full-stack solution, easy to set up | -- Pending |
| Gate pipeline stages via store validation | Single source of truth for stage completion | -- Pending |
| Keep existing wizard flow, add gating on top | Don't break working navigation UX | -- Pending |

---
*Last updated: 2026-03-30 after re-initialization for NYRADNA*
