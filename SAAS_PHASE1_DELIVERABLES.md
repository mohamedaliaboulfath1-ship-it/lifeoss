# SaaS Phase 1 — Multi-Tenant Deliverables

## Summary

LifeOS Phase 1 adds multi-tenant SaaS foundations **without modifying Mohamed Ali's production data**. All changes are additive.

## Critical Protection — Mohamed Ali

| Guard | Implementation |
|-------|----------------|
| Super Admin role | Migration `020` promotes `mohamedaliabouelfath1@gmail.com` to `super_admin` |
| Skip onboarding/demo seed | `shouldSkipOnboarding()` in `src/lib/tenant/super-admin.ts` |
| Mohamed Arabic seed | Email-gated in `maybeSeedMohamedArabic()` — unchanged |
| Mohamed Books seed | Email-gated in `maybeSeedMohamedBooksLibrary()` — unchanged |
| POST seed APIs | `/api/seed/mohamed-*` now require `requireSuperAdmin()` |
| Onboarding API | Returns `skipped` for super admin — never overwrites |

## Multi-Tenant Architecture

| Layer | Status |
|-------|--------|
| RLS `auth.uid() = user_id` | ✅ Already on all user tables |
| `tenant_id` on profiles | ✅ Migration 020, defaults to `user.id` |
| `workspace_id` on profiles | ✅ Migration 020, defaults to `user.id` |
| `user_id` on all entities | ✅ Existing |
| Role hierarchy | `user` → `admin` → `super_admin` |

## New User Onboarding

1. **First login** → Primary Goal Picker modal (7 options)
2. **Generic demo templates** → `src/lib/seed/onboarding-templates.ts` (prefix `demo_`, tag `onboarding_demo_v1`)
3. **Never copies Mohamed's data** — separate template system
4. **Welcome Center** → `/welcome` with checklist + video placeholder + tours
5. **Auto-seed** → `maybeSeedOnboarding()` after goal selection via `/api/onboarding`

## New Routes

| Route | Purpose |
|-------|---------|
| `/welcome` | Welcome Center + Getting Started Checklist |
| `/guide` | Help Center / User Manual |
| `/wisdom` | Wisdom & Motivation (daily rotation) |

## Guided Tours

- **Driver.js** integrated in `src/lib/tours/driver-tours.ts`
- Tours: Dashboard, Goals, Habits, Life Map
- Skip via ESC (when dismissible); replay from `/welcome` or `/guide`
- Progress saved in `profiles.metadata.saas.toursCompleted`

## Empty States

- Enhanced `EmptyState` with `suggestedActions[]`
- Books library updated as reference pattern

## SaaS Subscription (Feature Flags Only)

- Plans: Free / Pro / Enterprise in `src/lib/tenant/subscription.ts`
- `FEATURE_FLAGS.billingEnabled = false`
- UI at `/account/subscription`

## Admin Protection

- Middleware blocks `/admin/*` for non-admin users
- `requireAdmin()` accepts `admin` and `super_admin`
- Seed APIs require `super_admin`

## Migration

Run: `npm run migrate` (applies `020_multi_tenant_saas.sql`)

## Files Added/Modified

### New
- `supabase/migrations/020_multi_tenant_saas.sql`
- `src/lib/tenant/{constants,super-admin,subscription}.ts`
- `src/lib/seed/{onboarding-templates,run-onboarding-seed}.ts`
- `src/lib/wisdom/quotes.ts`
- `src/lib/tours/driver-tours.ts`
- `src/app/api/onboarding/route.ts`
- `src/app/(dashboard)/{welcome,guide,wisdom}/page.tsx`
- `src/components/onboarding/*`
- `src/components/wisdom/wisdom-widget.tsx`

### Modified
- `src/app/api/data/route.ts` — onboarding seed hook
- `src/lib/supabase/middleware.ts` — admin route guard
- `src/lib/api-auth.ts` — `requireSuperAdmin`, `isAdminRole`
- `src/components/ui/{empty-state,app-modal}.tsx`
- Navigation, dashboard shell, subscription page

## Verification Checklist

- [ ] Mohamed login → full dataset unchanged, no goal picker
- [ ] New user register → goal picker → demo data → `/welcome`
- [ ] Demo data has `demo_` IDs and `isDemo: true` metadata
- [ ] `/admin` blocked for regular users
- [ ] `npm run build` passes
