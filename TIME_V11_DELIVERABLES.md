# LifeOS Pro V1.1 — Time Intelligence System

**تاريخ:** 8 يونيو 2026  
**البناء:** `npm run build` ✅  
**Migration:** `017_time_intelligence.sql` — **يجب تشغيله في Supabase**

---

## 1. ما تم تنفيذه (~75%)

| الميزة | الحالة |
|--------|--------|
| User Schedule Engine (عمل أحد–خميس، سبت، جمعة إجازة) | ✅ |
| Availability (حجب الجدولة أثناء العمل) | ✅ |
| Daily Capacity / Time Budget | ✅ |
| Weekly Capacity by Domain | ✅ |
| `/planner` — Day / Week / Month | ✅ |
| Smart Time Suggest | ✅ |
| Time Blocks CRUD + PARA links | ✅ |
| `/time` — Actual vs Planned | ✅ |
| Time Heatmap | ✅ |
| Deep Work / Pomodoro Timer | ✅ |
| Focus Score | ✅ |
| Smart Rescheduling (missed blocks) | ✅ |
| Goal Time Forecast (required_hours) | ✅ |
| Executive Time Metrics | ✅ |
| Burnout / Overcommitment Risk | ✅ |
| Lazy-loaded pages | ✅ |

### V1.2 (لم يُنفَّذ)
- Google/Apple/Outlook Calendar sync
- Full drag-resize multi-day recurring (UI basic)
- Habit preferred_time UI في /habits
- Realtime optimistic updates

---

## 2. Migration

```sql
-- شغّل في Supabase SQL Editor:
supabase/migrations/017_time_intelligence.sql
```

**جداول جديدة:**
- `user_time_settings`
- `time_blocks`
- `focus_sessions`

**أعمدة جديدة:**
- `goals.required_hours`, `goals.logged_hours`
- `habits.preferred_time`

---

## 3. APIs

| Endpoint | الوصف |
|----------|-------|
| `GET/PATCH /api/time/settings` | جدول الحياة |
| `GET/POST/PATCH/DELETE /api/time/blocks` | Time Blocks |
| `GET/POST /api/time/focus` | Deep Work sessions |
| `GET /api/time/overview` | Time Intelligence dashboard |
| `POST /api/time/suggest` | اقتراح أوقات |
| `GET /api/time/overview?reschedule=1` | إعادة جدولة تلقائية |

---

## 4. الصفحات

| Route | الوصف |
|-------|-------|
| `/planner` | Time Planner — Week grid + إنشاء كتل |
| `/time` | Time Intelligence — Capacity · Focus · Heatmap |
| `/timeblock` → `/planner` | redirect |
| `/pomodoro` → `/planner` | redirect |

---

## 5. الاستخدام السريع

1. **شغّل migration 017** في Supabase
2. افتح `/planner` — احفظ جدول عملك (مُعد مسبقاً لجدولك)
3. أنشئ **Time Block** أو استخدم **اقتراح وقت تلقائي**
4. افتح `/time` — راقب Time Budget و Focus Score
5. للأهداف الكبيرة: أضف `required_hours` في `/goals` (مثال: FMVA = 600)

---

## 6. الملفات الجديدة

### Migration
- `supabase/migrations/017_time_intelligence.sql`

### Types
- `src/types/time.ts`

### Lib
- `src/lib/time/defaults.ts`
- `src/lib/time/settings.ts`
- `src/lib/time/capacity.ts`
- `src/lib/time/scheduler.ts`
- `src/lib/time/focus-score.ts`
- `src/lib/time/blocks.ts`
- `src/lib/time/goal-forecast.ts`
- `src/lib/time/load-time-os.ts`

### APIs
- `src/app/api/time/settings/route.ts`
- `src/app/api/time/blocks/route.ts`
- `src/app/api/time/focus/route.ts`
- `src/app/api/time/overview/route.ts`
- `src/app/api/time/suggest/route.ts`

### UI
- `src/components/time/planner-view.tsx`
- `src/components/time/time-intelligence-view.tsx`
- `src/components/time/focus-timer.tsx`
- `src/components/time/time-heatmap.tsx`
- `src/components/time/schedule-settings-panel.tsx`

### Pages
- `src/app/(dashboard)/planner/page.tsx`
- `src/app/(dashboard)/time/page.tsx`

### Updated
- `src/lib/constants.ts` — nav
- `next.config.ts` — redirects
- `src/app/api/goals/route.ts` — requiredHours
- `src/components/dashboard/executive-view.tsx` — time metrics
