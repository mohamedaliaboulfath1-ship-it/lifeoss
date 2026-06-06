# LifeOS Pro — Post-Launch Checklist

Operator checklist after initial deploy. Mark items as you complete them.

**Production:** https://lifeoss-nine.vercel.app  
**Supabase:** `zxwsbjrqggjpqhtwjvby`  
**GitHub:** https://github.com/mohamedaliaboulfath1-ship-it/lifeoss.git

---

## Phase A — Database (Supabase SQL Editor)

Run in order if not already applied:

| # | File | Status |
|---|------|--------|
| 001–007 | Core + Pro schema | ✅ (applied earlier) |
| 008 | `008_account_profile.sql` | ☐ |
| 009 | `009_v1_completion.sql` | ☐ |
| 010 | `010_performance_hardening.sql` | ☐ |
| 011 | `011_fix_profiles_rls.sql` | ☐ |

**Verify:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('avatar_url', 'role', 'timezone', 'last_active_at');

SELECT id, public FROM storage.buckets
WHERE id IN ('avatars', 'book-covers', 'book-media', 'progress-photos');
```

---

## Phase B — Single Admin Account

One account only with `role = 'admin'`:

```sql
SELECT u.id, u.email, p.role FROM auth.users u
JOIN public.profiles p ON p.id = u.id;
```

- Delete duplicate users if more than one row per email
- Confirm admin: `role = 'admin'` on your account

---

## Phase C — Supabase Auth URLs

**Authentication → URL Configuration:**

| Setting | Value |
|---------|-------|
| Site URL | `https://lifeoss-nine.vercel.app` |
| Redirect URLs | `https://lifeoss-nine.vercel.app/auth/callback` |
| | `https://lifeoss-nine.vercel.app/reset-password` |
| | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/reset-password` |

**Email provider:** enabled (Confirm email: off for faster signup, optional).

---

## Phase D — Application Deploy

```bash
npm run build
npm run test:smoke
npm run test:backup
git push origin main
npx vercel --prod --yes
```

---

## Phase E — Smoke Test (Manual)

| Test | URL / Action | Expected |
|------|--------------|----------|
| Login | `/login` | Dashboard loads |
| Dashboard | `/dashboard` | No PROFILE_NOT_FOUND |
| Habits toggle | `/habits` | No full page refresh |
| Books | `/books` | Add book, gallery works |
| Account | `/account/profile` | Profile loads |
| Admin | `/admin` | KPIs (admin role only) |
| Forgot password | `/forgot-password` | Email sent |
| PWA | DevTools → Application | manifest + sw registered |
| Export | `/account/export` | JSON downloads |

---

## Phase F — Optional Enhancements

| Item | Where |
|------|-------|
| Custom domain | Vercel → Domains |
| OpenAI / Anthropic keys | Vercel env vars |
| Supabase PITR backup | Supabase Pro plan |
| CI workflow | GitHub Actions (V1.1) |

---

## Completion Status

| Area | Target |
|------|--------|
| Migrations 001–011 | All applied |
| Single admin account | No duplicates |
| Auth redirect URLs | 4 URLs configured |
| Production deploy | Latest commit on Vercel |
| Login → Dashboard | Works without errors |

When all Phase A–E items pass, **production readiness = 95%+**.
