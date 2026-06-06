# LifeOS Pro — API Reference

**Base URL (production):** `https://lifeoss-nine.vercel.app`  
**Auth:** Supabase session cookies (browser) or authenticated SSR context  
**Errors:** JSON `{ "error": "message" }` — HTTP 401 (unauth), 403 (forbidden), 500 (server)

All routes below require a valid session unless noted. Admin routes require `profiles.role = 'admin'`.

---

## Authentication Behavior

| Status | Condition |
|--------|-----------|
| 401 | No session (`requireSession`) |
| 403 | Suspended account or non-admin on admin routes |
| 503 | Supabase not configured (missing env vars) |

---

## Core Data

### `GET /api/data`

Returns full user context: profile, current year, `yearData`, `dashboard`.

### `PATCH /api/data`

Update profile fields and/or `currentYear`. Body: `{ profile?: {...}, currentYear?: string }`.

### `GET /api/year?year=YYYY`

Get or create life year scope for a specific year.

### `PUT /api/year`

Initialize / reset current year context.

---

## Entity APIs

### Tasks — `/api/tasks`

| Method | Description |
|--------|-------------|
| `GET` | List tasks. Query: `status`, `goalId` |
| `POST` | Create task. Body: `title`, `status`, `priority`, `dueDate`, `goalId`, `note` |
| `PATCH` | Update task by `id` |
| `DELETE` | Delete task. Query: `id` |

### Habits — `/api/habits`

| Method | Description |
|--------|-------------|
| `GET` | List habits + today's log status |
| `POST` | Create habit or log completion |
| `PATCH` | Update habit |
| `DELETE` | Delete habit. Query: `id` |

### Goals — `/api/goals`

| Method | Description |
|--------|-------------|
| `GET` | List goals. Query: `year` (optional) |
| `POST` | Create goal |
| `PATCH` | Update goal |
| `DELETE` | Delete goal. Query: `id` |

### Body — `/api/body`

| Method | Description |
|--------|-------------|
| `GET` | Body measurements list |
| `POST` | Add measurement |
| `DELETE` | Remove measurement. Query: `id` |

### Weight — `/api/weight`

| Method | Description |
|--------|-------------|
| `GET` | Weight logs |
| `POST` | Add weight entry |
| `DELETE` | Remove entry. Query: `id` |

### Workouts — `/api/workouts`

| Method | Description |
|--------|-------------|
| `GET` | Workouts + set logs. Query: `date` |
| `POST` | Log workout / sets |
| `DELETE` | Remove workout. Query: `id` |

### Nutrition — `/api/nutrition`

| Method | Description |
|--------|-------------|
| `GET` | Meal logs. Query: `date` |
| `POST` | Add meal log |
| `DELETE` | Remove meal. Query: `id` |

### Finance — `/api/finance`

| Method | Description |
|--------|-------------|
| `GET` | Transactions, debts, budgets. Query: `type` = `transaction` \| `debt` \| `budget` \| `all` |
| `POST` | Create entity. Body: `{ entity, payload }` |
| `PATCH` | Update entity. Body: `{ entity, payload }` |
| `DELETE` | Delete entity. Query: `entity`, `id` |

### Books — `/api/books`

| Method | Description |
|--------|-------------|
| `GET` | Books library + reading progress |
| `POST` | Add book |
| `PATCH` | Update book |
| `DELETE` | Delete book. Query: `id` |

### Career — `/api/career`

| Method | Description |
|--------|-------------|
| `POST` | Create career entity. Body: `{ entity: "job_application" \| "interview" \| "mentor" \| "network_contact", payload }` |

> Career reads are served via `GET /api/data` aggregation, not a dedicated GET route.

### Learning — `/api/learning`

| Method | Description |
|--------|-------------|
| `POST` | Log study session. Body: `{ topic, date?, durationMin?, focus? }` |

---

## Account & Preferences

### `GET /api/account`

Profile, email, last sign-in.

### `PATCH /api/account`

Update: `displayName`, `avatarUrl`, `timezone`, `language`, `bio`, `city`.

### `GET /api/preferences`

User theme and notification preferences.

### `PATCH /api/preferences`

Update preferences JSON.

---

## Notifications — `/api/notifications`

| Method | Description |
|--------|-------------|
| `GET` | List notifications (max 50). Query: `unread=1` |
| `PATCH` | Mark read/dismissed. Body: `{ id, read?, dismissed? }` |
| `POST` | Create notification. Body: `type`, `title`, `body?`, `actionUrl?`, `priority?` |

---

## Archive — `/api/archive`

| Method | Description |
|--------|-------------|
| `GET` | List snapshots/summaries. Query: `preview=YYYY`, `compare=1` |
| `POST` | Archive current year. Body: `{ year, label? }` |

---

## Reviews — `/api/reviews`

| Method | Description |
|--------|-------------|
| `GET` | Period reviews. Query: `period` |
| `POST` | Create review |
| `PATCH` | Update review |
| `DELETE` | Delete review. Query: `id` |

---

## V1 Platform APIs

### `GET /api/v1/dashboard`

Dashboard snapshot for current user.

### `GET /api/v1/analytics`

Compute and return full analytics; upserts today's `daily_scores`.

### `GET /api/v1/search`

Global fuzzy search. Query: `q` (min 2 chars). Returns goals, habits, tasks, books, finance, certs, courses.

### `GET /api/v1/export`

Export user data. Query: `format` = `json` (default) \| `pdf` \| `xlsx`.

### `POST /api/v1/import/lifeos-v1`

Import LifeOS v1 backup. Body: `{ backup: V1Backup, dryRun?: boolean }`.

### AI

| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/ai/insights` | `GET` | AI insights (mock or configured provider) |
| `/api/v1/ai/brief` | `GET` | Daily brief text |
| `/api/v1/ai/coach` | `POST` | Coach interaction |

---

## Admin — `/api/admin` (admin only)

### `GET ?action=`

| action | Response |
|--------|----------|
| `stats` (default) | `totalUsers`, `activeUsers7d`, `newRegistrations7d`, `totalBooks`, `totalNotifications`, `systemHealth` |
| `users` | User list (max 50). Query: `q` (name search) |
| `activity` | Last 100 `activity_log` entries |

### `PATCH`

Update user. Body: `{ userId, suspended?: boolean, role?: "user" \| "admin" }`.

---

## Deprecated

### `POST /api/import`

Returns **410 Gone**. Use `/api/v1/import/lifeos-v1` instead.

---

## Response Conventions

- Entity lists return domain-specific keys: `{ goals }`, `{ tasks }`, `{ notifications }`, etc.
- Mutations return `{ ok: true, id? }` on success.
- Validation errors from Zod return 500 with error message (consider 400 in future).

---

## Client Usage Example

```typescript
// Create a task
await fetch("/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Review quarterly goals",
    priority: "p1",
    status: "active",
  }),
});

// Export JSON backup
const res = await fetch("/api/v1/export?format=json");
const backup = await res.json();
```
