# Phase 11: Cinematic Luxury Redesign - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete visual redesign of the entire NYRADNA Director app to match the cinematic luxury aesthetic from the user's HTML reference. Replace the Atlas Cloud purple (#7F72F7) theme with a softer lavender (#c6bfff/#8c80ff) cinematic palette. Glassmorphism everywhere, ultra-wide letter-spacing, Manrope headlines, spacious layouts, film-production language.

</domain>

<decisions>
## Implementation Decisions

### Design System (LOCKED — from user's HTML reference)

**Color Palette:**
- Background: #050507 (true black)
- Surface: #0a0a0e
- Surface Container Low: #1b1b20
- Surface Container: #1f1f24
- Surface Container High: #2a292f
- Surface Container Highest: #35343a
- Primary: #c6bfff (soft lavender)
- Primary Container: #8c80ff (vivid purple)
- Secondary: #fface8 (pink)
- On Surface: #e4e1e8
- On Surface Variant: #c8c4d6
- Outline: #928f9f
- Outline Variant: #474554
- Error: #ffb4ab

**Glass Effect:**
- glass-card: bg rgba(255,255,255,0.05) + backdrop-blur(50px) + border 1px solid rgba(198,191,255,0.25)
- cinematic-glow: box-shadow inset 0 0 40px rgba(198,191,255,0.08), 0 20px 50px rgba(0,0,0,0.5)
- Radial ambient: radial-gradient purple + pink blobs on body

**Typography:**
- Headlines: Manrope (font-light, tracking-[-0.03em], up to text-7xl)
- Body: Inter (font-normal, tracking-wide, text-lg)
- Labels: Inter (text-[10px], tracking-[0.2em]-[0.5em], uppercase, font-bold)
- Install: google fonts Manrope + Inter

**Layout:**
- Top nav: fixed, h-16, glass bg (bg-white/10 backdrop-blur-3xl), border-b border-white/10
- Sidebar: fixed left, w-64, glass bg (bg-white/5 backdrop-blur-2xl), border-r border-white/10
- Active sidebar item: border-r-2 border-indigo-400, bg-gradient-to-r from-indigo-500/10
- Content: ml-64 pt-32 pb-24 px-16 (very spacious)
- Cards: glass-card with p-10 (very spacious), rounded-xl
- Sections: mb-32 between major sections

**Components:**
- Buttons Primary: bg-primary text-on-primary-fixed px-8 py-4 rounded-full, shadow glow
- Buttons Ghost: bg-white/10 backdrop-blur-xl border border-white/30 rounded-full
- Cards: glass-card cinematic-glow rounded-xl, hover:bg-white/10
- Archive rows: bg-white/[0.02] hover:bg-white/[0.08] border border-white/10
- Badges/Labels: text-[10px] tracking-[0.3em] uppercase font-bold
- FAB: fixed bottom-12 right-12, rounded-full with glow shadow

**Icons:**
- Material Symbols Outlined, wght 200 (thin), FILL 0

### Scope — ALL files need updating

**Globals + Layout (3 files):**
- src/app/globals.css — new CSS vars, glass-card, cinematic-glow, radial-ambient classes
- src/app/layout.tsx — Manrope + Inter fonts, body classes
- src/app/(auth)/layout.tsx — glass sidebar + top nav structure

**Navigation (2 files):**
- src/components/layout/Sidebar.tsx — glass sidebar, right-border active, wide tracking labels
- src/components/layout/TopNav.tsx — glass top nav, minimal

**Create pages (10 files):**
- All pages under src/app/(auth)/create/ — spacious layouts, glass cards, cinematic typography

**Other pages (5 files):**
- dashboard, projects, characters, settings, landing page

**Pipeline components (6 files):**
- SegmentNode, PipelineCanvas, GapMarker, GapDetailPanel, NodeControls, ValidationReportPanel

**Asset components (4 files):**
- AssetSetCard, AssetItemGrid, FileUploadZone, GeneratedAssetsPanel

### Color Mapping

| Old (Atlas) | New (Cinematic) |
|---|---|
| #0A0A0F | #050507 (body) / #0a0a0e (surface) |
| #12121A | rgba(255,255,255,0.05) glass |
| #1A1A2E | #1f1f24 surface-container |
| #7F72F7 | #c6bfff (primary) / #8c80ff (primary-container) |
| #A78BFA | #c6bfff |
| #A0A0B8 | #c8c4d6 (on-surface-variant) |
| #6B6B80 | #928f9f (outline) |
| border-[#7F72F7]/10 | border-white/10 or border rgba(198,191,255,0.25) |
| bg-[#12121A] | glass-card class |
| font-bold tracking-tight | font-light tracking-[-0.03em] for headlines |

</decisions>

<code_context>
## Existing Code Insights

### What Changes
- Replace ALL #7F72F7 with #c6bfff or #8c80ff depending on context
- Replace ALL #A78BFA with #c6bfff
- Replace ALL #0A0A0F bg with #050507
- Replace ALL #12121A cards with glass-card effect
- Replace ALL solid backgrounds with glass (rgba + backdrop-blur)
- Add Manrope font for headlines
- Change all heading styles to font-light with wide/negative tracking
- Change all label styles to text-[10px] tracking-[0.2em+] uppercase
- Make layouts much more spacious (p-10 cards, mb-32 sections, px-16 content)
- Add radial ambient gradient to body
- Add cinematic-glow to featured elements

### Integration Points
- globals.css needs the custom CSS classes (glass-card, cinematic-glow, radial-ambient)
- layout.tsx needs both Manrope + Inter fonts
- Sidebar needs complete restructure (glass, right-border active)
- TopNav needs complete restructure (glass, minimal)
- Every page needs spacing + typography updates

</code_context>

<specifics>
## Specific Ideas

Match the exact aesthetic from the user's HTML reference — cinematic, luxury, sparse, wide spacing. Film-production tool feel. Labels should feel like they're etched into the UI. Glass cards should feel like floating panels. The whole app should feel like a high-end creative suite.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
