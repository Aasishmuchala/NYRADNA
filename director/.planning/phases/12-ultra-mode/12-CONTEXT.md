# Phase 12: Ultra Mode — Film-Grade Pipeline

**Status:** Ready for planning

<domain>
## Phase Boundary
Implement the DIRECTOR ULTRA MODE — ControlNet + 3D Scene Composer + Identity Lock + Quality Gates for film-grade AI filmmaking with identity-locked multi-shot consistency. Password-protected feature.

4 sub-phases:
- Phase 12a: Control Signal API Routes (8 new endpoints)
- Phase 12b: Pipeline Node Definitions + Ultra Node Executors (9 new nodes)
- Phase 12c: Three.js 3D Scene Composer
- Phase 12d: Polish, Integration & Ultra Mode Toggle with password lock
</domain>

<decisions>
## Implementation Decisions
### Password Lock
Ultra Mode gated behind password in Settings page. Store hashed password in localStorage. When user enables Ultra Mode toggle, prompt for password. Once unlocked, stays unlocked for the session.

### All at Claude's discretion per the detailed plan.md provided by user.
</decisions>
