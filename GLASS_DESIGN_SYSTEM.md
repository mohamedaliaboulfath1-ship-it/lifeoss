# LifeOS — Liquid Glass Design System

**Version:** 1.0 · June 2026  
**Inspiration:** Apple Liquid Glass · visionOS · Linear · Arc Browser · premium SaaS  
**Scope:** UI/UX only — zero functionality changes

---

## Overview

LifeOS now uses a **Liquid Glass** design language: layered transparency, soft reflections, gradient depth, and GPU-accelerated motion. All surfaces feel like floating glass panels over a living ambient background.

### Design principles

| Principle | Implementation |
|-----------|----------------|
| Alive | Staggered unfold, flowing edges, particle heroes |
| Premium | Inner glow, glass edge highlights, depth shadows |
| Layered | `surface-l1`–`l4` blur tiers + z-separated chrome |
| Lightweight | `backdrop-filter` + `color-mix` (no heavy bitmaps) |
| Accessible | `prefers-reduced-motion` disables lifts & page animations |

---

## Color Tokens

### Base surfaces (CSS variables)

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#0c0e14` | `#e8ecf3` |
| `--surface` | `#171b26` | `#f2f5fa` |
| `--surface2` | `#1e2433` | `#e9edf4` |
| `--text` | `#e8ecf2` | `#1e2430` |

### Semantic glows

| State | Token | Class |
|-------|-------|-------|
| Success | `--success` `#34d399` | `.glass-glow-success` |
| Warning | `--warning` `#fbbf24` | `.glass-glow-warning` |
| Critical | `--critical` `#f87171` | `.glass-glow-critical` |
| Growth | `--growth` `#38bdf8` | `.state-growth` |

---

## Domain Gradients

Never flat — every domain card uses a multi-stop gradient accent.

| Domain | Gradient | CSS class |
|--------|----------|-----------|
| Health | Emerald → Cyan | `.glass-gradient-health` |
| Finance | Blue → Indigo | `.glass-gradient-finance` |
| Career | Purple → Violet | `.glass-gradient-career` |
| Learning | Orange → Amber | `.glass-gradient-learning` |
| Body | Teal → Emerald | `.glass-gradient-body` |
| Mind | Indigo → Purple | `.glass-gradient-mind` |
| Soul | Pink → Violet | `.glass-gradient-soul` |
| Goals | Blue → Purple | `.glass-gradient-goals` |
| Default | Gold → Sky | `.glass-gradient-default` |

**Source:** `src/lib/design/glass-tokens.ts`

---

## Glass Components

| Component | Path | Use |
|-----------|------|-----|
| `GlassCard` | `src/components/glass/index.tsx` | Primary floating surface |
| `GlassPanel` | ↑ | Secondary panels, inset sections |
| `GlassWidget` | ↑ | Titled dashboard widget + unfold |
| `GlassModal` | ↑ | Modal content shell |
| `GlassSidebar` | ↑ | App navigation chrome |
| `GlassNavbar` | ↑ | Page topbar chrome |
| `MotionGlassCard` | ↑ | Animated card with hover lift |

### Core CSS utilities (`globals.css`)

| Class | Effect |
|-------|--------|
| `.liquid-glass` | Base translucent surface + depth shadow |
| `.glass-blur-{sm,md,lg,xl}` | Backdrop blur tiers (8–28px) |
| `.glass-reflect` | Top-edge specular highlight |
| `.glass-edge` | Translucent gradient border mask |
| `.glass-inner-glow` | Inset ambient glow |
| `.glass-lift` | Hover translate + shadow deepen |
| `.glass-sidebar` | Navigation glass chrome |
| `.glass-navbar` | Sticky header glass chrome |

### Usage

```tsx
import { GlassCard, GlassWidget, GlassNavbar } from "@/components/glass";

<GlassWidget title="Today's Focus" icon="⚡" domain="goals" delay={0.1}>
  {children}
</GlassWidget>
```

The base `Card` component now renders as `liquid-glass` by default — existing pages inherit the system automatically.

---

## Motion System

**Source:** `src/lib/motion/glass.ts` (exported via `@/lib/motion`)

| Preset | Behavior |
|--------|----------|
| `pageEntry` | Fade + scale + upward slide |
| `cardUnfold` | Carpet-roll 3D unfold with spring |
| `stagger(i)` | Sequential reveal delay |
| `hoverLift` | Glass lift on hover |
| `modalExpand` | Glass expansion for modals |
| `liquidPress` | Button press scale |
| `successPulse` | Green glow ring (habits) |
| `celebration` | Scale pop (goals/achievements) |
| `sidebarSlide` | Premium nav slide-in |

### Performance rules

- Animations use **opacity + transform only** (GPU)
- `prefers-reduced-motion` disables `.glass-lift`, `.animate-page-in`, unfold springs
- No layout-thrashing properties (`width`, `height`, `top`) in transitions
- Existing lazy-load + React Query optimizations preserved

---

## Micro-interactions

| Action | Feedback |
|--------|----------|
| Habit completed | Emerald ripple + `successPulse` + ring expand (`HabitCheck`) |
| Goal expand | 3D card unfold via `GoalExpandOverlay` |
| Weight update | `CountUp` / `AnimatedCounter` smooth tick |
| KPI hover | `kpiPulse` + glass lift + gradient accent line |
| Life Map edge | Animated flow dashes + glow on highlight |
| Life Map node | Glass surface + selection ring glow |

---

## Page Applications

### Dashboard (`dashboard-view.tsx`)

| Section | Glass treatment |
|---------|-----------------|
| Hero overview | `glass-gradient-default` + inner glow |
| Today's focus | `glass-gradient-goals` priorities card |
| Habits | `glass-gradient-health` widget |
| Weekly pulse | `glass-gradient-health` |
| Tasks due | `glass-gradient-finance` |
| At-risk goals | `glass-glow-critical` |
| KPI row | Liquid glass cards with domain gradient wash |
| Active goals | `glass-gradient-goals` |

Layout: asymmetrical **BentoGrid** hero (unchanged structure, enhanced surfaces).

### Areas (`areas-intelligence-view.tsx`)

| Section | Treatment |
|---------|-----------|
| Hero | `liquid-glass` shell + particles + gradient wash |
| Life Score pill | Inner glow glass |
| KPI tiles | Glass lift tiles + warning glow |
| Area cards | Asymmetric 12-col bento grid |
| Area card inner | `liquid-glass` over gradient border frame |
| PARA graph | Existing React Flow (glass canvas) |
| Add modal | `GlassModal` expansion |

### Area Hub (`area-hub-view.tsx`)

- Command center hero: liquid glass over domain gradient
- Tab panels: inherit glass `Card` base
- Coach / intelligence panels: unchanged logic, glass surfaces

### Life Map

| Element | Treatment |
|---------|-----------|
| Nodes | `liquid-glass` + radial/linear gradient + selection glow |
| Edges | Gradient stroke + animated flow + dual drop-shadow |
| Panel | `glass-blur-xl` slide-over |
| Canvas | `.life-map-flow` controls styling |

### Chrome

| Element | Component |
|---------|-----------|
| Sidebar | `GlassSidebar` |
| Topbar | `GlassNavbar` |
| Loading shell | `glass-sidebar` skeleton |

---

## Light & Dark Mode

Both themes have dedicated glass overrides in `globals.css`:

- **Dark:** Deep translucent surfaces, white edge highlights at 10–14% mix
- **Light:** Soft white/sky/gold washes, stronger inset highlights, no washed-out pastels
- **Auto:** Via existing `ThemeProvider` (`data-theme` attribute)

Test checklist:
- [ ] Dashboard hero readable in light mode
- [ ] Sidebar border visible but subtle in both modes
- [ ] Life Map node contrast ≥ 4.5:1 for labels
- [ ] Warning/critical glows distinguishable in light mode

---

## Accessibility

- All glass surfaces maintain text on `--text` / `--text2` tokens (WCAG-aware pairs)
- Focus rings: `.focus-ring` (gold ring, offset)
- Reduced motion: global CSS + `useReducedMotion()` in animated glass components
- Glass blur degrades gracefully — solid `color-mix` fallback if `backdrop-filter` unsupported
- Icon + text labels preserved (no icon-only critical actions)

---

## Before / After — Screenshot Checklist

Capture these views in **dark** and **light** mode after deploy:

| # | View | What changed |
|---|------|--------------|
| 1 | `/dashboard` | Hero glass, gradient KPIs, priorities glow |
| 2 | `/areas` | Hero shell, asymmetric area grid, PARA graph |
| 3 | `/areas/body` (or any slug) | Command center hero glass |
| 4 | `/life-map` | Glowing nodes, animated edges, glass panel |
| 5 | `/habits` | Glass habit cards (via base Card) |
| 6 | Sidebar + topbar | Glass chrome, reflection layer |
| 7 | Modal (add area) | Glass expansion animation |
| 8 | Habit toggle | Success pulse feedback |

---

## File Map

```
src/
├── components/glass/index.tsx      # Glass component library
├── lib/design/glass-tokens.ts      # Domain gradients & semantics
├── lib/motion/glass.ts             # Motion presets
├── app/globals.css                 # Liquid glass CSS utilities
├── components/ui/card.tsx          # Default liquid-glass card
├── components/layout/sidebar.tsx     # GlassSidebar
├── components/layout/topbar.tsx    # GlassNavbar
├── components/dashboard/dashboard-view.tsx
├── components/areas/areas-hero.tsx
├── components/areas/area-premium-card.tsx
├── components/areas/areas-intelligence-view.tsx
├── components/life-map/life-map-node.tsx
└── components/life-map/life-map-edge.tsx
```

---

## Migration Guide

To apply glass to a new surface:

1. Replace `glass-premium` or `card-premium` with `liquid-glass glass-blur-md glass-reflect`
2. Add domain class: `glass-gradient-{domain}` for colored sections
3. Add semantic glow if needed: `glass-glow-success|warning|critical`
4. Wrap animated sections in `MotionGlassCard` or `GlassWidget`
5. Respect `useReducedMotion()` for custom Framer Motion

**Do not** change props, data fetching, or event handlers when applying glass.

---

*Built on top of LifeOS Performance Engineering (`cef8564`) — all optimizations preserved.*
