# LifeOS Pro — Performance Audit & Optimization Report

**Date:** June 2026  
**Commit scope:** Performance-only (no new features)

---

## Executive Summary

LifeOS was feature-complete but suffered from **slow navigation**, **blocking data loads**, and **redundant server queries**. This pass targets perceived load time, server efficiency, and client bundle weight.

### Estimated Speed Gains

| Area | Before | After (est.) | Improvement |
|------|--------|--------------|-------------|
| Areas overview API | ~96 DB round-trips | ~13 round-trips | **~87% fewer queries** |
| Areas page polling | 30s interval + focus refetch | TanStack Query 90s stale | **~70% fewer requests** |
| Habit toggle on dashboard | Full `/api/data` reload (~40 queries) | Optimistic local only | **~100% saved on toggle** |
| Dashboard first paint | Sync Remotion + full view | Dynamic import + skeleton | **~200–400ms faster TTI** |
| Navigation between pages | No cache, refetch every mount | 45–90s stale cache | **Instant when cached** |

---

## 1. React Optimization

### Done
- **Split `LifeOSContext`** into `LifeOSDataContext` + `LifeOSActionsContext` — components using only actions avoid data-driven rerenders
- **`React.memo`** on `MiniChart`, `LazyChart`, `AreaPremiumCard` pattern ready
- **Removed redundant `refreshSilent()`** after habit toggles on dashboard (optimistic UI only)

### Remaining (future pass)
- Broader `React.memo` on dashboard widgets (`KpiCard`, `HabitsToday`, command-center panels)
- `GoalExpandProvider` value memoization

---

## 2. Next.js Optimization

### Done
- **TanStack Query** integrated via `QueryProvider`
- **Dynamic imports:**
  - `DashboardView` (dashboard page)
  - Remotion players in `DashboardView` (`LifeScoreOrbPlayer`, `AmbientHeroBg`, `WeeklyPulsePlayer`)
  - `AreaParaFlow` (viewport-gated via `AreasParaSection`)
- **Dashboard skeleton** shown immediately while data/view loads (no blank `return null`)

### Route bundle sizes (post-build)

| Route | First Load JS |
|-------|---------------|
| `/dashboard` | **2.53 kB** page (was ~12.7 kB) + shared 103 kB |
| `/areas` | ~9.6 kB page |
| `/areas/[slug]` | ~883 B page (hub lazy) |
| `/life-map` | ~7.1 kB page |

---

## 3. Data Fetching (TanStack Query)

### Configuration
- **Global staleTime:** 60s
- **LifeOS data:** 45s stale, `placeholderData` keeps previous on refetch
- **Areas overview:** 90s stale, no 30s polling
- **Area hub:** 90s stale, cached per slug

### Query keys (`src/lib/query/keys.ts`)
- `lifeos`, `areas-overview`, `area-hub/:slug`, `life-map`, `analytics`

### Benefits
- No loading flash on background refresh
- Deduplicated concurrent requests
- Stale-while-revalidate navigation

---

## 4. Supabase / Query Optimization

### Critical fix: Areas Overview N+1
**Before:** `loadAreasOverview` called `loadAreaHub` × 8 domains = **~96 queries**  
**After:** `fetchAreasSharedData` runs **12 parallel queries once**, in-memory domain aggregation = **~13 queries total**

File: `src/lib/areas/shared-data.ts`

### Explicit column selection
Replaced `select("*")` with scoped column lists for goals, habits, tasks, books, courses, certifications.

### New migration: `019_performance_indexes_v2.sql`
Indexes on:
- `goals(user_id, domain_id, status)`, `goals(user_id, parent_id)`
- `habits(user_id, active, domain_id)`, `habits(user_id, goal_id)`
- `life_tasks(user_id, domain_id, status)`, `life_tasks(user_id, goal_id)`
- `books/courses/certifications(user_id, domain_id)`
- `weight_logs`, `reading_logs`, `study_sessions`, `transactions` (user_id + date)
- `life_domains(user_id, is_active, sort_order)`

---

## 5. Dashboard Progressive Loading

- Shell + skeleton render immediately
- Remotion deferred via `next/dynamic`
- Critical KPIs from cached `dashboard` snapshot in context
- Charts can use `LazyChart` (Intersection Observer) — component added at `src/components/ui/lazy-chart.tsx`

---

## 6. Chart Optimization

- **No Recharts** in codebase — charts are custom SVG + framer-motion
- **`LazyChart`** wrapper renders `MiniChart` only when visible
- **`MiniChart`** memoized to prevent parent rerender cascades

---

## 7. Life Map Optimization

Already in place (prior commits):
- Overview mode: ~7 nodes
- Branch mode: max 32 children
- Full mode: capped at 120 nodes
- `LifeMapCanvas` lazy-loaded with `ssr: false`

---

## 8. Animation Optimization

- `useReducedMotion` respected in particles, unfold animations
- GPU hints via `transform-gpu` in motion presets
- Area card shine disabled under `prefers-reduced-motion`

---

## 9. Database Audit

### Slowest queries (identified)
1. `/api/data` → `assembleYearPayload` + `loadRelationalYearData` (~27 tables) + `buildDashboardSnapshot` (~14 queries)
2. `/api/areas/overview` (was N×hub — **fixed**)
3. `/api/life-map` (full graph build — mitigated by view modes)

### Largest payload tables (typical)
- `habit_logs` (unbounded per user)
- `life_tasks`, `goals`, `transactions`

### Recommendations (not implemented — requires schema/feature decisions)
- Split `/api/data` into profile + per-route endpoints
- Paginate `habit_logs` (life-map already limits to 30 days)
- Server Components for static dashboard shell

---

## 10. Bundle Size

### Shared JS: **103 kB** (all routes)

### Heavy dependencies
| Package | Usage | Mitigation |
|---------|-------|------------|
| `@remotion/player` | Dashboard hero | Dynamic import |
| `@xyflow/react` | Life Map, Areas PARA | Route-level + viewport lazy |
| `framer-motion` | Global animations | Keep — use transform/opacity only |
| `jspdf` / `xlsx` | Export only | Already route-scoped |

### Dead code candidates
- `src/components/areas/areas-view.tsx` (legacy, unused)
- `src/components/areas/area-knowledge-graph.tsx` (replaced by React Flow)

---

## 11. Lighthouse Target

**Target:** Performance > 95

**Expected improvements:**
- Faster FCP from skeleton-first rendering
- Lower TBT from deferred Remotion/React Flow
- Reduced server latency on `/api/areas/overview`

Run locally: `npm run build && npm start` then Lighthouse on `/dashboard`, `/areas`.

---

## 12. Pages Improved

| Page | Changes |
|------|---------|
| `/dashboard` | Dynamic view, skeleton, deferred Remotion |
| `/areas` | TanStack Query, batched API, lazy PARA graph |
| `/areas/[slug]` | TanStack Query, no polling, lazy PARA tab |
| Global | QueryProvider, split context, query caching |

---

## Files Changed (this optimization pass)

- `src/lib/query/*` — Query client + keys
- `src/components/providers/query-provider.tsx`
- `src/contexts/lifeos-context.tsx` — TanStack Query + split context
- `src/lib/areas/shared-data.ts` — Batched areas data
- `src/lib/areas/load-hub.ts` — Uses shared fetch
- `src/hooks/queries/*` — Areas hooks
- `src/components/ui/lazy-chart.tsx`
- `src/components/areas/areas-para-section.tsx`
- `supabase/migrations/019_performance_indexes_v2.sql`
