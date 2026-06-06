# LifeOS Pro — Backup and Recovery

LifeOS Pro supports multiple backup strategies: user-initiated export, legacy v1 import, year archival, and platform-level Supabase backups.

> Alias of `BACKUP_RECOVERY_GUIDE.md` — use either document interchangeably.

---

## Backup Types

| Type | Scope | Format | Initiated by |
|------|-------|--------|--------------|
| **User export** | Single user, current context | JSON / PDF / XLSX | User (Account → Export) |
| **Year archive** | Single year snapshot | JSONB in `yearly_snapshots` | User (Archive page) |
| **V1 import** | Migrate from LifeOS HTML app | JSON backup file | User (Settings → Import) |
| **Platform backup** | Entire database | Supabase PITR / dump | Operator |

---

## User Export (Recommended)

### Via UI

1. Navigate to **Account → Export** (`/account/export`).
2. Click **Export JSON** — downloads full user context.

### Via API

```
GET /api/v1/export?format=json   # Full context (profile + yearData + dashboard)
GET /api/v1/export?format=pdf    # Dashboard PDF report
GET /api/v1/export?format=xlsx   # Excel workbook
```

Filename pattern: `lifeos-{year}-{date}.json`

### Export contents

The JSON export includes aggregated relational data via `getUserContext()`:

- Profile and settings
- Goals, habits, tasks
- Body, workouts, nutrition
- Finance, books, career, learning
- Dashboard snapshot

> Export is **user-scoped** and respects RLS — only the authenticated user's data is included.

### Recovery from JSON export

1. Create a new LifeOS account (or use the same account after data loss).
2. Use entity APIs or a custom restore script to re-insert data.
3. For LifeOS v1 format backups, use the v1 importer (below).

There is no one-click JSON restore in V1 — import path is optimized for **LifeOS v1 HTML** backup format.

---

## LifeOS v1 Import

For users migrating from the standalone LifeOS HTML app (`exportAllData()`).

### Endpoint

```
POST /api/v1/import/lifeos-v1
```

### Dry run (validate without writing)

```json
{
  "backup": { "...": "v1 export object" },
  "dryRun": true
}
```

Returns `storeCounts` and `totalRecords`.

### Full import

```json
{
  "backup": { "version": "...", "goals": [], "habits": [], "settings": {} }
}
```

Returns import report with per-entity counts and errors.

### Prerequisites

- Migrations **005** through **010** must be applied.
- If import fails with `relation` / `column` errors → run pending migrations.

### Deprecated route

`POST /api/import` returns **410** — do not use.

---

## Year Archival

```
POST /api/archive
Body: { "year": "2025", "label": "Optional label" }
```

Stored in `yearly_snapshots` and `yearly_summaries`.

List archives: `GET /api/archive`

---

## Platform-Level Backup (Operators)

### Supabase automated backups

- **Free tier:** Daily backups (limited retention).
- **Pro tier:** Point-in-Time Recovery (PITR).

Dashboard → Project Settings → Database → Backups.

### Manual SQL dump

```bash
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --no-owner \
  -f lifeos-backup-$(date +%Y%m%d).sql
```

Store dumps encrypted off-site. Never commit dumps to git.

### Storage backup

Storage objects (avatars, book covers, progress photos, book media) are **not** in SQL dumps. Use Supabase Storage API bulk download or replicate to S3.

---

## Disaster Recovery Playbook

### Scenario A — Single user data corruption

1. User exports JSON if partial data remains.
2. Identify affected tables.
3. Delete corrupted rows via Supabase Table Editor (user-scoped).
4. Re-import from v1 backup or manual API re-entry.

### Scenario B — Application deploy failure

1. Vercel → Promote last known good deployment.
2. No database action if schema unchanged.

### Scenario C — Database failure

1. Supabase → Database → Backups → Restore (or PITR).
2. Verify migrations 001–010 applied post-restore.
3. Redeploy Vercel; verify `/api/data` and auth.

### Scenario D — Full platform migration

1. `pg_dump` source database.
2. Create new Supabase project; restore dump.
3. Update Vercel env vars; update Auth redirect URLs.
4. Run `npm run test:smoke`.

---

## Recovery Testing

| Test | Command / Action |
|------|------------------|
| Mapper integrity | `npm run test:backup` |
| V1 structure | `npm run test:smoke` |
| Import dry-run | POST v1 backup with `dryRun: true` |
| Export round-trip | Export JSON → verify file contains goals/habits |

---

## Known Limitations (V1)

- No automated scheduled user backups.
- JSON export ≠ direct SQL restore format.
- `life_years.payload` is empty by design.
- Career/learning POST-only APIs may require re-seeding after restore.
