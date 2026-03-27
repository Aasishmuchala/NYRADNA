# DIRECTOR — Design & UI Audit Report
## Reference HTML vs Current Next.js TSX

---

## 🔴 CRITICAL — Page 1: Landing Page (`page.tsx` vs `landing_sign_in/code.html`)

**Severity: FULL REWRITE NEEDED** — This page has the most mismatches.

| # | Element | Reference (correct) | Current (wrong) | Fix |
|---|---------|---------------------|-----------------|-----|
| 1 | **DIRECTOR branding** | `<span class="text-2xl font-black tracking-tighter text-primary font-headline">DIRECTOR</span>` | `<h2 class="text-sm uppercase tracking-widest font-semibold">Director</h2>` | Change to `text-2xl font-black tracking-tighter text-[#ff9064] font-headline`, text = "DIRECTOR" (all caps) |
| 2 | **Branding wrapper** | `<div class="mb-12 flex justify-center">` | `<div class="mb-8">` | Change mb-8 → mb-12, add `flex justify-center` |
| 3 | **H1 heading** | `text-5xl md:text-7xl lg:text-8xl font-black font-headline tracking-tighter leading-[0.9]` | `text-5xl md:text-6xl font-bold leading-tight` | Must be `font-black font-headline tracking-tighter leading-[0.9]`, add `lg:text-8xl` |
| 4 | **Grid columns** | `lg:col-span-8 lg:col-start-3` (centered 8 cols) | `md:col-span-8` with empty 2-col divs on sides | Use `lg:col-span-8 lg:col-start-3`, remove empty side divs |
| 5 | **Background structure** | Nested: `<div class="absolute inset-0 z-0">` wrapping vignette (z-10) + img | Flat siblings: separate vignette div + img | Wrap both in parent `<div class="absolute inset-0 z-0">`, vignette z-10, content z-20 |
| 6 | **Video demo image** | DIFFERENT image URL (fashion model in desert): `AB6AXuCiVQaydChm...` | Same hero background image reused | Replace with correct reference image URL |
| 7 | **Video container** | `p-1 bg-surface-container-low rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] group` | `bg-[#1a1a1a] rounded-lg border border-[#494847]/20` | Match reference: `p-1 bg-[#131313] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]` |
| 8 | **Prompt text** | `"A luxury watch rising through liquid obsidian, dramatic side lighting..."` | `"Generate a cinematic shot of a luxury watch in a minimalist studio setting"` | Replace with exact reference text |
| 9 | **Prompt overlay style** | `bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-lg border border-outline-variant/15 flex items-center gap-4` | `bg-[#1a1a1a]/90 backdrop-blur rounded-lg p-4 border border-[#494847]/20` with `flex items-start gap-3` | Match reference classes; use `items-center gap-4` |
| 10 | **Prompt text style** | `text-sm font-medium tracking-tight text-on-surface-variant italic` | `text-sm text-white/80` | Add `font-medium tracking-tight italic`, use `text-[#adaaaa]` |
| 11 | **Start CTA button** | `bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg px-10 py-5 hover:scale-105 active:scale-95` with `arrow_forward` icon | `bg-[#ff9064] text-[#0e0e0e] font-semibold rounded-lg px-8 py-3` — no icon, no gradient | Add gradient, icon, `px-10 py-5`, `font-bold`, hover/active scale |
| 12 | **Sign in button** | `bg-surface-container-highest text-on-surface font-bold rounded-lg px-10 py-5 active:scale-95` | `border border-[#494847] text-white font-semibold rounded-lg px-8 py-3` | Change to `bg-[#262626] text-white font-bold px-10 py-5`, remove border |
| 13 | **Scroll indicator** | "Showcase" text + `w-[1px] h-12 bg-gradient-to-b from-primary to-transparent` line | "Scroll" text + bouncing dot in bordered circle | Replace entirely with "Showcase" + gradient line |
| 14 | **Trust section heading** | `text-center mb-20` with centered `h-1 w-20 bg-primary mx-auto rounded-full` bar | Left-aligned `mb-16` with `w-16 h-1 bg-[#ff9064]` (no mx-auto, no rounded-full) | Center-align, use `mb-20`, add `mx-auto rounded-full` to bar, set `w-20` |
| 15 | **Trust section bg** | `bg-surface-container-low` (= `bg-[#131313]`) | `bg-[#131313]` ✓ | OK |
| 16 | **Trust heading font** | `font-headline text-3xl font-bold tracking-tight` | `text-3xl md:text-4xl font-bold` (missing font-headline, tracking-tight) | Add `font-headline tracking-tight`, remove `md:text-4xl` |
| 17 | **Trust grid** | `grid-cols-1 md:grid-cols-12 gap-8` with col-span-7/5/4/8 layout | Needs verification — likely also wrong | Match reference grid structure exactly |
| 18 | **Footer** | Matches reference format ✓ | Needs "flex-wrap justify-center" on nav links | Add `flex-wrap justify-center` |

---

## 🟡 MODERATE — Page 2: Dashboard (`(auth)/dashboard/page.tsx` vs `dashboard_home/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Sidebar px** | Sidebar inner: `py-6 space-y-2`, Brand in `px-6`, Nav in `px-2` | `py-6 px-6` on parent — nav items don't have mx-2 | Remove px-6 from parent, add px-6 only to brand, px-2 spacing to nav wrapper |
| 2 | **Nav "Dashboard" label** | `<span class="font-headline font-bold">Dashboard</span>` | `<span class="font-bold">Dashboard</span>` | Add `font-headline` class |
| 3 | **Nav inactive labels** | `<span class="font-headline">Projects</span>` etc. | `<span>Projects</span>` | Add `font-headline` class to all nav labels |
| 4 | **Icon text color** | Brand icon: `text-on-primary font-bold` | `text-white` | Change to `text-[#571a00]` |
| 5 | **Header border** | No `border-b` on header | Has `border-b border-white/5` | Remove `border-b border-white/5` |
| 6 | **Search input** | `focus:ring-1 focus:ring-primary/50` | `focus:outline-none` (no ring) | Add `focus:ring-1 focus:ring-[#ff9064]/50` |
| 7 | **Notification dot** | `bg-primary border-2 border-surface` | `bg-red-500` (no border) | Change to `bg-[#ff9064]`, add `border-2 border-[#0e0e0e]` |
| 8 | **User border** | `border-outline-variant/30` | `border-white/20` | Change to `border-[#494847]/30` |
| 9 | **Hero section** | `space-y-1` | `space-y-2` | Change to `space-y-1` |
| 10 | **Hero heading** | `text-3xl md:text-4xl font-extrabold headline-font tracking-tighter` | Needs checking | Must match reference exactly |
| 11 | **Border divider** | `border-t border-outline-variant/15` | `border-t border-white/5` | Change to `border-[#494847]/15` |
| 12 | **Missing sections** | Has 2 project cards, "Start New Project" button, right-side Resource Usage panel, mobile footer | Needs full audit of remaining content | TSX must include ALL sections from reference: project cards, resource panel, upsell card, collaborators, mobile footer |

---

## 🟡 MODERATE — Page 3: Intent Input (`(auth)/create/intent/page.tsx` vs `intent_input/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Root tag** | `<body>` (valid in HTML) | `<body>` (INVALID in React/JSX!) | Change `<body>` → `<div>` |
| 2 | **Header classes** | `docked full-width` | `docked full-width` (NOT valid Tailwind!) | Remove `docked full-width` — these are HTML-only classes from the reference that don't exist in Tailwind |
| 3 | **Footer present** | Has full footer component | Has footer ✓ | OK |
| 4 | **Overall structure** | Very close match | Close ✓ | Minor class cleanup needed |

---

## 🟢 MINOR — Page 4: Brief Interrogation (`(auth)/create/brief/page.tsx` vs `brief_interrogation/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Header position** | `docked full-width top-0 ... fixed` | `sticky top-0` | Change `sticky` → `fixed` (add padding to main content) |
| 2 | **Header shadow** | `shadow-[0_20px_40px_rgba(0,0,0,0.4)]` | `shadow-[0_20px_40px_rgba(0,0,0,0.4)]` ✓ | OK |
| 3 | **Persona card rendering** | Static HTML cards with explicit content | Data-driven `.map()` with dynamic rendering | Acceptable — content matches. Consider removing `useState` if not needed for interaction |
| 4 | **h1 font** | `font-headline font-black` | `font-black` (missing font-headline) | Add `font-headline` class |
| 5 | **Footer gap** | `gap-8` | `gap-6` | Change to `gap-8` |
| 6 | **Footer links** | `opacity-80 hover:opacity-100` on each link | Missing opacity classes | Add `opacity-80 hover:opacity-100` to footer links |

---

## 🟢 MINOR — Page 5: Character Setup (`(auth)/create/character-setup/page.tsx` vs `character_setup/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Characters nav "font-bold"** | `<span class="font-bold">Characters</span>` | Has font-bold on Link wrapper, not span | Move font-bold to span text |
| 2 | **Active nav item** | Just `<span class="font-bold">` inside link | OK structurally | Close match ✓ |
| 3 | **Overall** | Very close match | TSX matches reference well | Minor cleanup only |

---

## 🟢 MINOR — Page 6: Style DNA (`(auth)/create/style-dna/page.tsx` vs `style_dna/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Body overflow** | `overflow-hidden` on body | `fixed inset-0 flex flex-col overflow-hidden` on root div | Close — different approach but same visual |
| 2 | **Header position** | `fixed` | Not fixed (no position class) | Add `fixed w-full` to header |
| 3 | **Main height** | `flex h-screen pt-[72px]` | `flex h-[calc(100vh-72px)]` | Reference uses `h-screen pt-[72px]`; current approach is equivalent |
| 4 | **Color swatch rendering** | Static HTML buttons | Data-driven `.map()` | Acceptable — content matches |
| 5 | **Aspect ratio 16:9 box** | `h-4.5` | `h-4` | Change to `h-[18px]` (4.5 × 4px) or `h-4.5` if Tailwind supports |
| 6 | **Overall** | Very close match | TSX matches reference well | Minor tweaks |

---

## 🟢 MINOR — Page 7: Generating Pipeline (`(auth)/create/generating/page.tsx` vs `generation_progress/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Sidebar brand icon** | `w-10 h-10` rounded-lg | `w-10 h-10` rounded-lg ✓ | OK |
| 2 | **"New Project" button** | `bg-[#262626] text-white` with `add_circle` icon | Same ✓ | OK |
| 3 | **Header back arrow icon** | Reference matches current | ✓ | OK |
| 4 | **Scene shimmer CSS** | `.shimmer` class in style tag | `.shimmer` referenced but may not have CSS class defined | Ensure `.shimmer` CSS class exists in `<style>` block |
| 5 | **Overall** | Very close match | TSX matches reference well | Minor cleanup |

---

## 🟢 MINOR — Page 8: Review Refine (`(auth)/create/review/page.tsx` vs `scene_review/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Main layout** | `pt-24 min-h-screen flex` (no flex-col, no flex-1) | `pt-24 min-h-screen flex flex-col flex-1 overflow-hidden` | Remove `flex-col flex-1 overflow-hidden` |
| 2 | **Sidebar** | Starts at top but with `pt-24` | Has `pt-24` ✓ | OK |
| 3 | **Scene detail panel** | `glass-panel` class: `background: rgba(38,38,38,0.7); backdrop-filter: blur(24px);` | Missing glass-panel styling | Add `glass-panel` or equivalent inline style to right sidebar |
| 4 | **Scene detail panel** | `w-[420px]` right panel with full content (character anchor, stats grid, prompt info, action buttons) | Partial implementation — needs verification | Ensure all subsections match reference |
| 5 | **cinematic-shimmer CSS** | Defined in style tag | Needs to be present | Ensure CSS class is in `<style>` block |

---

## 🟢 MINOR — Page 9: Export Share (`(auth)/create/export/page.tsx` vs `film_preview_export/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Nav links** | Has Dashboard, Projects, Characters | Same ✓ (Settings missing in both) | OK |
| 2 | **Overall** | Very close match | TSX matches reference very well | Minimal fixes |

---

## 🟢 MINOR — Page 10: Project Library (`(auth)/projects/page.tsx` vs `project_library/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Project card names** | "Neon Genesis: Part II", "Desert Echoes", "Noir Studio Session", "Forest Sprint Final" | "Neon Genesis: Part II", "Desert Echoes", "Noir Studio", "Forest Sprint" | Fix names: "Noir Studio" → "Noir Studio Session", "Forest Sprint" → "Forest Sprint Final" |
| 2 | **Card rendering** | Static HTML | Data-driven `.map()` | Acceptable |
| 3 | **Extra project cards** | Reference shows 4 cards + 2 more (6 total visible) | Has 6 projects in array | Verify all 6 render correctly |
| 4 | **Overall** | Very close match | TSX matches reference well | Minor name fixes |

---

## 🟢 MINOR — Page 11: Character Gallery (`(auth)/characters/page.tsx` vs `character_library/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **Overall** | Very close structural match | TSX matches reference well | Minimal fixes needed |
| 2 | **Character card content** | Full card content with tags, images, buttons | Needs verification of all 3+ character cards | Ensure all character cards match reference exactly |

---

## 🟢 MINOR — Page 12: Settings & Billing (`(auth)/settings/page.tsx` vs `settings_billing/code.html`)

| # | Element | Reference | Current | Fix |
|---|---------|-----------|---------|-----|
| 1 | **cinematic-glow CSS** | Defined in style tag as `box-shadow: 0 0 40px rgba(0,0,0,0.4)` | Used as class on sidebar but CSS may not be defined | Ensure `.cinematic-glow` is in `<style>` block |
| 2 | **glass-panel CSS** | Defined in style tag | Used on billing card | Ensure `.glass-panel` CSS exists |
| 3 | **Overall** | Very close match | TSX matches reference well | CSS class definitions only |

---

## SUMMARY: Priority Order for Fixes

### 🔴 CRITICAL (Requires Full Rewrite)
1. **Landing Page** — 18+ mismatches, completely wrong branding, wrong images, wrong CTAs, wrong scroll indicator, wrong trust section alignment

### 🟡 MODERATE (Significant Fixes)
2. **Dashboard** — Missing sidebar px structure, missing font-headline on nav, wrong notification dot color, missing Resource Usage right panel content, wrong border colors
3. **Intent Input** — Invalid `<body>` tag in JSX, invalid `docked full-width` classes

### 🟢 MINOR (Small Tweaks)
4. **Brief Interrogation** — header `sticky` → `fixed`, missing `font-headline` on h1, footer gap
5. **Style DNA** — header position, aspect ratio box height
6. **Character Setup** — font-bold placement
7. **Generating Pipeline** — shimmer CSS class
8. **Review Refine** — flex layout classes, glass-panel CSS
9. **Export Share** — minimal
10. **Project Library** — project name text corrections
11. **Character Gallery** — minimal
12. **Settings & Billing** — CSS class definitions

### Global Issues Found Across Multiple Pages:
- `docked full-width` classes used on headers in intent, brief, style-dna, generating, review, settings pages — **these are NOT valid Tailwind classes** and should be removed (they come from the HTML reference but serve no purpose in Tailwind)
- Some pages use `font-headline` / `font-body` / `font-label` semantic classes, others hardcode colors — should be consistent
