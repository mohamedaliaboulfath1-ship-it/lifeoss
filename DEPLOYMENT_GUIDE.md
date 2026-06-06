# LifeOS Pro — Deployment Guide

Deploy LifeOS Pro to **Vercel** with **Supabase** as the backend. Production instance: https://lifeoss-nine.vercel.app

---

## Prerequisites

- GitHub repo: https://github.com/mohamedaliaboulfath1-ship-it/lifeoss.git
- Supabase project: `zxwsbjrqggjpqhtwjvby`
- Node.js 20+ locally for build verification

---

## 1. Supabase Setup

### Create / verify project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project `zxwsbjrqggjpqhtwjvby`.
2. Note **Project URL** and **anon public key** (Settings → API).

### Run migrations

Apply SQL migrations **001 through 011** in order:

**Option A — SQL Editor (recommended for first deploy)**

1. Supabase → SQL Editor → New query.
2. Paste and run each file from `supabase/migrations/` sequentially.

**Option B — CLI script**

```bash
export SUPABASE_DB_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
npm run migrate
```

Connection string: Project Settings → Database → Connection string (URI, pooler).

### Auth configuration

1. Authentication → URL Configuration:
   - **Site URL:** `https://lifeoss-nine.vercel.app`
   - **Redirect URLs:** add:
     - `https://lifeoss-nine.vercel.app/auth/callback`
     - `https://lifeoss-nine.vercel.app/reset-password`
     - `http://localhost:3000/auth/callback` (local dev)
     - `http://localhost:3000/reset-password` (local dev)
2. Enable Email provider (and OAuth if desired).
3. Email templates: customize password reset / confirm if needed.

### Storage

Migrations 006, 008, 009 create buckets and RLS policies automatically. Verify in Storage:

- `avatars`, `book-covers`, `progress-photos`, `book-media`

---

## 2. Vercel Setup

### Import project

1. [Vercel Dashboard](https://vercel.com) → Add New Project → Import from GitHub `lifeoss`.
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: repository root.

### Environment variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zxwsbjrqggjpqhtwjvby.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key from Supabase | Production, Preview, Development |
| `OPENAI_API_KEY` | Optional — AI activation | Production |
| `ANTHROPIC_API_KEY` | Optional — AI activation | Production |

> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use only in secure server scripts if needed.

### Build settings

- **Build command:** `npm run build` (default)
- **Install command:** `npm install`
- **Node version:** 20.x

### Deploy

Push to `main` or trigger manual deploy. Vercel runs `next build` and deploys serverless functions for `/api/*`.

---

## 3. Post-Deploy Verification

```bash
# Local smoke test (structure checks)
npm run test:smoke

# Production health checks
curl -I https://lifeoss-nine.vercel.app
```

Manual checklist:

- [ ] `/login` loads; register + email flow works
- [ ] `/dashboard` loads after auth
- [ ] `GET /api/data` returns 401 when logged out, 200 when logged in
- [ ] PWA manifest at `/manifest.json`
- [ ] Service worker at `/sw.js` registers (check DevTools → Application)

---

## 4. Local Development

```bash
git clone https://github.com/mohamedaliaboulfath1-ship-it/lifeoss.git
cd lifeoss
cp .env.example .env.local
# Fill in Supabase URL + anon key
npm install
npm run dev
```

Open http://localhost:3000 — middleware redirects to `/login` if unauthenticated.

---

## 5. Domain & HTTPS

Production domain `lifeoss-nine.vercel.app` is managed by Vercel. For a custom domain:

1. Vercel → Project → Settings → Domains → Add domain.
2. Update Supabase Auth Site URL and redirect URLs to match.
3. Redeploy.

---

## 6. CI / Quality Gates

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint (Next.js config) |
| `npm run build` | Production build validation |
| `npm run test:smoke` | V1 file structure sanity |
| `npm run test:backup` | Import mapper unit checks |

Recommended: run `build` + `test:smoke` on every PR.

---

## 7. Rollback

- **Vercel:** Deployments → select previous deployment → Promote to Production.
- **Database:** Migrations are additive; rollback SQL must be written manually. Prefer forward-fix migrations.
- **Supabase:** Point-in-time recovery available on paid plans (Dashboard → Database → Backups).

---

## 8. Scaling Notes

- API routes are stateless serverless functions — scale with Vercel automatically.
- Supabase connection pooling: use pooler URI for migrations and server-side batch jobs.
- Storage egress: book-media bucket is public; monitor bandwidth on high-traffic deployments.
