# Phase 10: Atlas Cloud Redesign - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete visual redesign of the entire NYRADNA Director app to match the Atlas Cloud AI aesthetic. Replace the current orange (#ff9064) accent theme with a purple (#7F72F7) accent, ultra-dark backgrounds, glassmorphism cards, and professional SaaS styling. Every page and component must be updated.

</domain>

<decisions>
## Implementation Decisions

### Design System (LOCKED)

**Color Palette:**
- Primary: #7F72F7 (purple/violet)
- Primary Light: #A78BFA
- Background: #0A0A0F (near-black with subtle blue tint)
- Surface: #12121A (card backgrounds)
- Surface Raised: #1A1A2E (elevated panels, hover states)
- Border: rgba(127, 114, 247, 0.1) (subtle purple tint)
- Border Active: rgba(127, 114, 247, 0.3) (hover/focus)
- Text Primary: #FFFFFF
- Text Secondary: #A0A0B8
- Text Muted: #6B6B80
- Success: #34D399
- Warning: #FBBF24
- Error: #EF4444

**Typography:**
- Font: Inter (install @fontsource/inter or use next/font/google)
- Headings: font-bold, tracking-tight (-0.02em)
- Labels: uppercase, tracking-widest, text-[10px]
- Body: font-normal, leading-relaxed

**Components:**
- Cards: bg-[#12121A], border border-[#7F72F7]/10, rounded-xl, hover:border-[#7F72F7]/30 hover:shadow-[0_0_20px_rgba(127,114,247,0.15)]
- Buttons Primary: bg-gradient-to-r from-[#7F72F7] to-[#A78BFA], text-white, rounded-lg
- Buttons Secondary: border border-[#7F72F7]/30, text-[#7F72F7], hover:bg-[#7F72F7]/10
- Buttons Ghost: text-[#A0A0B8], hover:text-white, hover:bg-[#1A1A2E]
- Inputs: bg-[#0A0A0F], border border-[#7F72F7]/10, focus:border-[#7F72F7]/50 focus:ring-1 focus:ring-[#7F72F7]/30
- Badges: uppercase text-[10px] px-2 py-0.5 rounded-full
- Sidebar active: text-[#7F72F7] with left border-l-2 border-[#7F72F7] bg-[#7F72F7]/5

**Visual Effects:**
- Purple glow on hover: shadow-[0_0_20px_rgba(127,114,247,0.15)]
- Glassmorphism panels: bg-[#12121A]/80 backdrop-blur-xl
- Gradient accent lines: from-[#7F72F7] to-[#A78BFA]
- Progress bars: purple gradient fill

### Scope

Every file with visual styling must be updated:
- Sidebar.tsx — new colors, active state, brand section
- TopNav.tsx — dark theme, purple accents
- All 10 create/* pages — replace orange with purple, update backgrounds, cards, buttons
- All pipeline components — SegmentNode, PipelineCanvas, GapMarker, GapDetailPanel, NodeControls, ValidationReportPanel
- All asset components — AssetSetCard, AssetItemGrid, FileUploadZone, GeneratedAssetsPanel
- Layout files — root layout, auth layout
- Global CSS — Tailwind config or CSS variables
- Landing page

</decisions>

<code_context>
## Existing Code Insights

### What Changes
- Replace ALL #ff9064 (orange) with #7F72F7 (purple)
- Replace ALL #0e0e0e backgrounds with #0A0A0F
- Replace ALL #262626 surfaces with #12121A
- Replace ALL #333333 borders with rgba(127,114,247,0.1)
- Replace ALL #131313 with #1A1A2E
- Replace ALL #adaaaa muted text with #A0A0B8
- Replace font-manrope with font-inter (Inter font)
- Add purple glow effects on hover
- Add gradient buttons where orange CTAs exist

### Files to Update (complete list)
1. src/app/layout.tsx — Inter font, global bg
2. src/app/page.tsx — landing page
3. src/app/(auth)/layout.tsx — auth wrapper bg
4. src/components/layout/Sidebar.tsx — full restyle
5. src/components/layout/TopNav.tsx — full restyle
6. src/app/(auth)/dashboard/page.tsx
7. src/app/(auth)/create/intent/page.tsx
8. src/app/(auth)/create/brief/page.tsx
9. src/app/(auth)/create/directors-cut/page.tsx
10. src/app/(auth)/create/style-dna/page.tsx
11. src/app/(auth)/create/character-setup/page.tsx
12. src/app/(auth)/create/review/page.tsx
13. src/app/(auth)/create/generating/page.tsx
14. src/app/(auth)/create/export/page.tsx
15. src/app/(auth)/create/asset-sets/page.tsx
16. src/app/(auth)/create/pipeline/page.tsx
17. src/app/(auth)/projects/page.tsx
18. src/app/(auth)/characters/page.tsx
19. src/app/(auth)/settings/page.tsx
20. src/components/pipeline/SegmentNode.tsx
21. src/components/pipeline/PipelineCanvas.tsx
22. src/components/pipeline/GapMarker.tsx
23. src/components/pipeline/GapDetailPanel.tsx
24. src/components/pipeline/NodeControls.tsx
25. src/components/pipeline/ValidationReportPanel.tsx
26. src/components/assets/AssetSetCard.tsx
27. src/components/assets/AssetItemGrid.tsx
28. src/components/assets/FileUploadZone.tsx
29. src/components/assets/GeneratedAssetsPanel.tsx
30. src/app/globals.css (or equivalent)

</code_context>

<specifics>
## Specific Ideas

Match the Atlas Cloud AI aesthetic: ultra-dark backgrounds, purple accents, clean card layouts, professional SaaS feel. No orange anywhere. Purple glow on interactive elements. Glass effect on panels.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
