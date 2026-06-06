# LifeOS Pro — Security Guide

Security model for LifeOS Pro: Supabase Auth, Row Level Security, RBAC, and storage isolation.

---

## Threat Model (V1)

| Asset | Risk | Mitigation |
|-------|------|------------|
| User life data | Unauthorized read/write | RLS on all tables |
| Admin operations | Privilege escalation | `profiles.role` + `requireAdmin()` |
| Session tokens | Hijacking | HTTP-only cookies via `@supabase/ssr` |
| File uploads | Malware / oversize | MIME allowlists + size limits |
| API abuse | Unauthenticated access | `requireSession()` on all data routes |

---

## Authentication

### Provider

Supabase Auth with email/password (OAuth extensible via Supabase dashboard).

### Session flow

1. User logs in → Supabase issues JWT.
2. `@supabase/ssr` stores session in **cookies** (not localStorage).
3. `middleware.ts` calls `updateSession()` on every request — refreshes tokens.
4. API routes call `supabase.auth.getUser()` server-side.

### Public routes (no auth required)

- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/*`
- `/api/*` — **not** gated by middleware; each route enforces auth internally

### Password reset

- `/forgot-password` → Supabase reset email
- `/reset-password` → token exchange via auth callback

### Account suspension

`profiles.suspended = true` → `requireAdmin()` and session checks return **403** for admin routes; extend to all routes in future.

---

## Row Level Security (RLS)

All user tables have RLS **enabled**. Default pattern:

```sql
using (auth.uid() = user_id)
with check (auth.uid() = user_id)
```

### Special policies

| Table | Policy | Rule |
|-------|--------|------|
| `profiles` | `profiles_select_own` | User reads own row |
| `profiles` | `profiles_admin_select` | Admin reads all profiles |
| `profiles` | `profiles_update_own` | User updates own row |
| `activity_log` | `activity_log_insert_own` | User inserts own events |
| `activity_log` | `activity_log_admin_read` | Admin reads all logs |
| `life_domains` | System rows | Readable by authenticated users |

### Service role

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. **Never** expose to client or `NEXT_PUBLIC_*` vars. Use only in trusted server scripts.

---

## RBAC (Role-Based Access Control)

| Role | DB value | Access |
|------|----------|--------|
| Standard user | `user` | Own data via RLS |
| Administrator | `admin` | Admin API + read all profiles + activity logs |

Enforcement layers:

1. **Database:** RLS policies check `profiles.role = 'admin'`
2. **API:** `requireAdmin()` in `src/lib/api-auth.ts`
3. **UI:** Admin layout probes API and redirects on 403

Admin role assignment is **database-only** (no self-promotion endpoint).

---

## API Security

### Validation

- Request bodies validated with **Zod** schemas in route handlers.
- Unknown fields stripped or rejected per schema.

### Error handling

- Generic Arabic error messages to clients.
- Detailed errors logged server-side (`console.error`).

### Rate limiting

Not implemented in V1. Recommended for production:

- Vercel WAF / rate limits on `/api/auth/*`
- Supabase Auth rate limits (built-in for email)

### CORS

Same-origin by default (Next.js app serves API). No public third-party API access in V1.

---

## Storage Security

### Bucket isolation

Files stored as `{user_id}/{filename}`. Policies enforce:

```sql
auth.uid()::text = (storage.foldername(name))[1]
```

### Bucket policies

| Bucket | Public read | Write | Max size |
|--------|-------------|-------|----------|
| `avatars` | Yes (public URLs) | Owner only | 2 MB |
| `book-covers` | No (auth select) | Owner only | 5 MB |
| `progress-photos` | No | Owner only | 10 MB |
| `book-media` | Yes | Owner only | 50 MB |

### Upload hardening

- **MIME allowlists** per bucket (no `*/*`).
- **Size limits** enforced at bucket level.
- PDF/EPUB allowed only on `book-media`.

### Recommendations

- Scan uploads for malware (future: ClamAV / cloud scanner).
- Prefer signed URLs for `book-media` if public access is not required.

---

## Client Security

### Environment variables

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are client-safe. Anon key is designed for RLS-protected client access.

### XSS

- React auto-escapes rendered content.
- Avoid `dangerouslySetInnerHTML` except trusted static content.

### PWA service worker

- Caches GET shell routes only.
- **Does not cache** `/api/*` responses (network-only for API).

---

## Data Privacy

- User data is siloed per `user_id` — no cross-tenant queries for standard users.
- Admin can read profile metadata and activity logs, not a dedicated "view all goals" UI in V1.
- Export is user-initiated; no admin bulk export in V1.

### GDPR / deletion

Account deletion flow should (future):

1. Delete `auth.users` row (cascades to `profiles` and owned entities).
2. Remove storage objects under user's folder prefix.

V1: manual deletion via Supabase dashboard.

---

## Security Checklist (Deploy)

- [ ] RLS enabled on all public schema tables
- [ ] Migrations 001–009 applied
- [ ] Auth redirect URLs whitelisted in Supabase
- [ ] No service role key in client bundle (`npm run build` + inspect)
- [ ] HTTPS enforced (Vercel default)
- [ ] Admin count minimized and audited
- [ ] `.env.local` in `.gitignore` (never commit secrets)

---

## Reporting Vulnerabilities

Report security issues privately to the repository owner. Do not open public issues for unpatched vulnerabilities.
