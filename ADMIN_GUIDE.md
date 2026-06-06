# LifeOS Pro — Admin Guide

LifeOS Pro includes an admin panel for user management, activity auditing, and system health monitoring. Access is controlled by **RBAC** via `profiles.role`.

---

## Granting Admin Access

There is no self-service admin promotion. The first admin must be assigned directly in the database.

### Step 1 — Find your user ID

1. Supabase Dashboard → Authentication → Users → copy UUID, **or**
2. After logging in, inspect `profiles.id` matching your auth user.

### Step 2 — Promote to admin

In Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_ID';
```

Verify:

```sql
select id, display_name, role from public.profiles where role = 'admin';
```

### Revoke admin

```sql
update public.profiles
set role = 'user'
where id = 'USER_ID';
```

---

## Accessing the Admin Panel

| URL | Page |
|-----|------|
| `/admin` | Dashboard — KPI stats |
| `/admin/users` | User management |
| `/admin/activity` | Activity audit log |
| `/admin/system` | System health JSON |

**Gate behavior:** `AdminLayout` calls `GET /api/admin?action=stats`. Non-admins receive **403** and are redirected to `/dashboard`.

Suspended admins (`profiles.suspended = true`) also receive 403 from `requireAdmin()`.

---

## Admin Panel Features

### Dashboard (`/admin`)

KPI cards:

- Total users
- Active users (last 7 days via `last_active_at`)
- New registrations (7 days)
- Total books across all users
- Total notifications
- System health status (`operational`)

Includes inline SQL hint for promoting admins.

### Users (`/admin/users`)

- Search users by `display_name` (max 50 results)
- View: role, suspended status, created date
- **Suspend / unsuspend** — `PATCH /api/admin` with `{ userId, suspended }`
- Role changes via API: `{ userId, role: "admin" | "user" }` (UI may expose this in future)

### Activity (`/admin/activity`)

Reads last **100** rows from `activity_log`:

- `action` — e.g. `admin_user_update`
- `user_id`, `entity_type`, `entity_id`
- `metadata` JSONB
- `created_at`

Users can insert their own activity rows; only admins can **read** all entries (RLS policy `activity_log_admin_read`).

### System (`/admin/system`)

Combines:

- Admin stats from `/api/admin?action=stats`
- Dashboard API probe (`/api/v1/dashboard`)
- Static labels: `build: production`, `database: supabase`

---

## Admin API Reference

### `GET /api/admin?action=stats`

Platform-wide counts. Admin only.

### `GET /api/admin?action=users&q=search`

List profiles: `id`, `display_name`, `role`, `suspended`, `created_at`, `last_active_at`.

### `GET /api/admin?action=activity`

Recent audit log entries.

### `PATCH /api/admin`

```json
{
  "userId": "uuid",
  "suspended": true,
  "role": "admin"
}
```

Logs `admin_user_update` to `activity_log`.

---

## RBAC Model

| Role | Capabilities |
|------|--------------|
| `user` | Own data only (RLS) |
| `admin` | Read all profiles, read all activity logs, admin API, admin UI |

**Not included in V1:**

- Fine-grained permissions (moderator, support tiers)
- Admin write access to other users' entity data
- Admin impersonation

---

## Security Best Practices

1. **Minimize admin count** — only trusted operators.
2. **Use suspension** before deletion for abusive accounts.
3. **Audit** — review `/admin/activity` after role changes.
4. **Never commit** service role keys; admin operations use authenticated session + RLS override policies.
5. **Rotate** admin access when team members leave.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirected from `/admin` | Confirm `role = 'admin'` in profiles |
| 403 on admin API | Check `suspended = false` |
| Empty user list | RLS policy `profiles_admin_select` requires migration 009 |
| Activity log empty | Normal until users/admins generate events |
