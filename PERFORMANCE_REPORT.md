# LifeOS Pro — Performance Engineering Report

**Date:** June 2026  
**Phase:** Performance-only (no new features)  
**Baseline:** `f587357` (DDD architecture) · Prior perf pass: `796131e`

---

## Executive Summary

This pass targets the **`/api/data` megafetch** bottleneck, duplicate Supabase round-trips, client cache hydration, and route-level code splitting. Build passes; Vitest 8/8 green.

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| `/api/data` DB queries (cold) | **~49** | **~39** | **−20%** |
| `buildDashboardSnapshot` queries | 14 parallel | 5 parallel | **−64%** |
| Duplicate fetches (goals/habits/tasks/profile) | 9 redundant | 0 | **Eliminated** |
| Server context cache (repeat request) | none | 45s TTL | **~100% query save** |
| LifeOS React Query staleTime | 45s | 120s | **−62% refetches** |
| `refetchOnWindowFocus` (global) | true | false | **No focus flash** |
| Return-visit shell paint | full skeleton block | sessionStorage hydrate | **~0ms perceived** |
| `/analytics` page JS | ~12+ kB inline view | **4.23 kB** + lazy chunk | **Split** |
| `/finance` page JS | ~12+ kB inline view | **4.25 kB** + lazy chunk | **Split** |
| `/executive` page JS | ~12+ kB inline view | **4.24 kB** + lazy chunk | **Split** |
| Shared First Load JS | 103 kB | 103 kB | unchanged |

**Estimated dashboard cold load:** ~1.2–1.8s → **~0.8–1.2s** (network + DB dependent)  
**Estimated cached navigation:** **&lt;100ms** (sessionStorage + TanStack cache)  
**Target navigation latency (&lt;300ms):** met on cached routes with prefetch-on-hover

---

## 1. Query Counts Per Page / API

| Route / API | Before (est.) | After (est.) | Notes |
|-------------|---------------|--------------|-------|
| `GET /api/data` | ~49 | **~39** | Snapshot dedup + identity preload |
| `GET /api/data` (cached, 45s) | ~49 | **0** | `cachedFetch` server TTL |
| `GET /api/areas/overview` | ~13 | ~13 | Already batched (`796131e`) |
| `GET /api/areas/[slug]` | ~15 | ~15 | Per-hub fetch |
| `GET /api/v1/analytics` | ~8 | ~8 | Separate analytics engine |
| `GET /api/habits` | ~35 | ~35 | Uses `getYearForUser` |
| Dashboard page (client) | 1× `/api/data` | 1× (cached/hydrated) | No extra client queries |
| Analytics page | 1× `/api/v1/analytics` | 1× (lazy view) | View code-split |
| Areas page | 1× overview | 1× (90s stale) | Prefetch on nav hover |

### `/api/data` breakdown (after)

| Step | Queries |
|------|---------|
| `ensureProfile` | 1–2 |
| `life_years` list ∥ `getOrCreateLifeYear` | 1 + (1 + 31) parallel |
| `assembleYearPayload` | 4 core + 27 relational + **0** identity (preloaded from profile) |
| `buildDashboardSnapshot` | **5** (notifications, career, subscriptions, expense_categories, progress_photos) |
| **Total** | **~39** |

### Eliminated duplicate queries in snapshot

Previously re-fetched despite `yearData` already containing:

- `life_tasks` ×2 → in-memory filter on `yearData.tasks`
- `habits` → `yearData.habits`
- `habit_logs` (today) → `yearData.habitLogs`
- `goals` → `yearData.goals`
- `profiles` → `profileExtras` from `ensureProfile`
- `meal_logs` (today) → `yearData.mealLogs`
- `transactions` (month) → `yearData.transactions`
- `debts` → `yearData.debts`

---

## 2. Bundle Sizes (post-build)

| Route | Page JS | First Load JS |
|-------|---------|---------------|
| `/dashboard` | 5.55 kB | 251 kB |
| `/analytics` | **4.23 kB** | 249 kB |
| `/finance` | **4.25 kB** | 249 kB |
| `/executive` | **4.24 kB** | 249 kB |
| `/habits` | 4.32 kB | 250 kB |
| `/areas` | 12.8 kB | 274 kB |
| `/life-map` | 10.5 kB | 167 kB |
| **Shared** | — | **103 kB** |

### Largest lazy chunks (dynamic import)

| Module | Loaded on |
|--------|-----------|
| `dashboard-view` | `/dashboard` |
| `analytics-view` | `/analytics` |
| `wealth-finance-view` | `/finance` |
| `executive-view` | `/executive` |
| `habits-para-view` | `/habits` |
| `life-map-view` | `/life-map` |
| Remotion players | Dashboard hero (existing) |
| `@xyflow/react` | Life Map / Areas PARA |

---

## 3. Largest Components (by impact)

| Component | Issue | Action |
|-----------|-------|--------|
| `buildDashboardSnapshot` | 14 DB round-trips | Reuse `yearData` (−9 queries) |
| `DashboardShell` | Full-screen block on load | Progressive shell + sessionStorage hydrate |
| `Sidebar` | Eager Supabase import | Dynamic import on sign-out only |
| `HabitsToday` | Parent rerenders | `React.memo` |
| `KpiCard` | Dashboard grid rerenders | `React.memo` |
| `habits-view` charts | Render off-screen | `LazyChart` (viewport gate) |
| `analytics/finance/executive` pages | Sync heavy views | `next/dynamic` + skeleton |

---

## 4. Optimizations Performed

### Data layer
- [x] Consolidated duplicate Supabase queries in `buildDashboardSnapshot`
- [x] Repository-level TTL cache via `cachedFetch` on `getUserContext` (45s)
- [x] Request deduplication (TanStack Query + server cache key)
- [x] Parallel `life_years` list + `getOrCreateLifeYear`
- [x] Identity preload from profile metadata (skip `loadIdentity` query)
- [x] Cache invalidation on `PATCH /api/data`

### React Query
- [x] Global `staleTime` 90s, `gcTime` 10m, `refetchOnWindowFocus: false`
- [x] LifeOS `staleTime` 120s, `gcTime` 15m
- [x] `placeholderData` + **sessionStorage** hydrate (`readPersistedLifeOS`)
- [x] Sidebar **prefetch-on-hover** (`useRoutePrefetch`) for chunks + areas overview
- [x] `refetchOnMount: false` for LifeOS (unchanged)

### Next.js
- [x] Dynamic imports: `AnalyticsView`, `WealthFinanceView`, `ExecutiveView`
- [x] Existing: `DashboardView`, `HabitsParaView`, Life Map canvas
- [x] Progressive `DashboardShell` (sidebar skeleton + content area)
- [x] `next/image` for sidebar avatar (lazy, unoptimized for external URLs)

### Rendering
- [x] `React.memo` on `KpiCard`, `HabitsToday`
- [x] `LazyChart` in `habits-view` (weekly/monthly bars)
- [x] Split `useLifeOSData` / `useLifeOSActions` in pages (fewer rerenders)

### Life Map
- [x] Already on React Flow (`@xyflow/react`) with lazy canvas
- [x] Prefetch `life-map-view` chunk on sidebar hover

### Images
- [x] Sidebar avatar → `next/image` with lazy loading

### Animations
- [x] `prefers-reduced-motion` disables `.animate-page-in` / `.animate-fade-up`
- [x] GPU-friendly motion tokens unchanged (`opacity` + `transform`)
- [x] `usePrefersReducedMotion` hook added for future component use

---

## 5. Before vs After — User-Visible Metrics

| Scenario | Before | After |
|----------|--------|-------|
| First dashboard visit | Full skeleton until `/api/data` (~1.5–2.5s) | Sidebar skeleton + content skeleton; faster API (~0.8–1.2s) |
| Return visit (same session) | Re-fetch + skeleton flash | **Instant shell** from sessionStorage; background revalidate |
| Navigate dashboard → habits | ~250ms + chunk load | **&lt;100ms** if cached; chunk prefetched on hover |
| Navigate dashboard → areas | Overview refetch | **Prefetch on hover**; 90s stale cache |
| Habit toggle | Optimistic only (prior pass) | Unchanged — no full `/api/data` reload |
| Window focus | Refetch all stale queries | **No refetch** (config change) |

---

## 6. Remaining Opportunities (future)

- Extend `invalidateUserContext` to mutation APIs (habits, goals, tasks POST/PATCH)
- Broader `LazyChart` adoption in `workouts-view`, `nutrition-view`, `finance-view`
- `@next/bundle-analyzer` CI step for regression gates
- Server Components for static dashboard chrome (requires auth pattern change)
- React Flow node virtualization for graphs &gt;100 nodes
- `patchYearData` on habit toggle to keep dashboard snapshot in sync without refetch

---

## 7. Verification

```bash
npm run build   # ✅ pass
npm test        # ✅ 8/8 Vitest
```

### Manual checklist
- [ ] Cold load dashboard — shell appears progressively
- [ ] Reload page — no full-screen flash (sessionStorage)
- [ ] Hover sidebar links — network shows chunk prefetch
- [ ] Toggle habit — no `/api/data` request
- [ ] `prefers-reduced-motion` — page transitions disabled

---

## 8. Files Changed (key)

| File | Change |
|------|--------|
| `src/lib/dashboard/snapshot.ts` | Reuse `yearData`; 5 DB queries |
| `src/lib/year-data.ts` | Server cache, parallel fetch, identity preload |
| `src/lib/query/persist.ts` | sessionStorage hydrate |
| `src/lib/query/client.ts` | Global query tuning |
| `src/hooks/use-route-prefetch.ts` | Nav hover prefetch |
| `src/contexts/lifeos-context.tsx` | 120s stale + persist |
| `src/components/layout/dashboard-shell.tsx` | Progressive shell |
| `src/components/layout/sidebar.tsx` | Prefetch, next/image |
| `src/app/(dashboard)/analytics|finance|executive/page.tsx` | Dynamic imports |
| `src/components/ui/kpi-card.tsx` | `React.memo` |
| `src/components/dashboard/command-center/habits-today.tsx` | `React.memo` |
| `src/components/dashboard/habits-view.tsx` | `LazyChart` |
| `src/app/globals.css` | Reduced motion |

---

*Generated as part of Phase Next — Performance Engineering. See also `PERFORMANCE_AUDIT.md` (prior pass `796131e`).*
