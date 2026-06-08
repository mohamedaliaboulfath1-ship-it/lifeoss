# LifeOS Pro — PARA + Habit System Architecture

## Philosophy

LifeOS is not a habit tracker. Every habit exists inside:

**Vision → Goal → Project → Habit → Daily Action**

Mapped to PARA:

| PARA | LifeOS Entity | Table |
|------|---------------|-------|
| **Areas** | Life Domains | `life_domains` |
| **Projects** | Goals `level=project` | `goals` |
| **Resources** | Books, foods, para_resources | `books`, `para_resources` |
| **Archives** | Archived tasks/goals, yearly_snapshots | `life_tasks.status=archive`, `goals.status=cancelled` |

## Data Model (Migration 014)

### Habit Intelligence (`habits` extensions)
- `project_id` → goals (project level)
- `goal_id` → goals (goal level) — existing
- `domain_id` → life_domains — existing
- `why`, `stop_impact`, `priority`, `impact`, `active_days`, `life_score_weight`

### Goal Contribution
- `goal_habit_links` — many-to-many with weights
- `goals.completion_score` — computed from tasks + habits + progress
- `goals.habit_contribution_pct` / `task_contribution_pct` / `progress_contribution_pct`

### Body
- `profiles.current_weight` — auto-synced from latest weight log

### Personalization
- `user_preferences.settings.personalization` — colors, icons, layout, widgets, sidebar order

## API Surface

| Endpoint | Purpose |
|----------|---------|
| `GET /api/habits` | Habits + logs + enriched intelligence |
| `POST/PATCH /api/habits` | CRUD with goal/project/domain links |
| `GET /api/areas` | Life domains (system + custom) |
| `POST/PATCH /api/areas` | Custom area management |
| `GET /api/goals/completion` | Goal completion scores |
| `POST /api/weight` | Log weight + sync `current_weight` |
| `PATCH /api/preferences` | Personalization settings |

## UI Wireframes

### Habits Page
```
[ KPIs: adherence | today | streak | life score impact ]
Tabs: 🎯 عاداتي | 📅 اليوم | 📊 تحليلات | 🗓️ أسبوع

عاداتي (cards grid):
┌─────────────────────────────┐
│ تمرين PPLUL          [High] │
│ 💪 الصحة                    │
│ هدف: 75 كجم                 │
│ مشروع: Muscle Gain 2026     │
│ سلسلة: 21 | أفضل: 40 | 87%  │
│ [✓ اليوم]  [تفاصيل]         │
└─────────────────────────────┘
```

### Areas Page (`/areas`)
Grid of 8 system areas + custom areas. Edit name/icon/color.

### Dashboard (Project-Centric)
```
مشاريع اليوم | أهداف معرضة للخطر | عادات مؤثرة | مهام حرجة | توصيات المدرب
```

## Execution Phases

1. ✅ Migration 014 + types + lib (habit-intelligence, goal-completion, body-analytics, habit-coach)
2. ✅ API extensions
3. ✅ Habits UI redesign + Areas page
4. ✅ Dashboard project panel + weight/body upgrades
5. ✅ Personalization in settings
