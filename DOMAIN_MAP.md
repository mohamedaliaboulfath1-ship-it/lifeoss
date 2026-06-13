# LifeOS Domain Map

## Domain Modules (`src/domains/`)

```
domains/
├── core/                 Entity, ValueObject, Repository, EventBus
├── shared/               Enums, Score/Percentage value objects
├── intelligence/         Life Score, Area Health, Goal/Habit engines
├── areas/                Life area health (delegates to intelligence)
├── goals/                GoalEntity, GoalService, GoalRepository
├── projects/             ProjectEntity
├── tasks/                TaskEntity
├── habits/               HabitEntity, HabitService, HabitRepository
├── finance/              Investment, Transaction, FinanceService
├── wealth/               Wealth snapshot (shim → lib/wealth)
├── body/                 BodyMeasurement, WeightEntry, BodyService
├── nutrition/            Diet modes (shim)
├── workouts/             Body analytics shim
├── books/                BookEntity
├── learning/             Learning paths (scaffold)
├── career/               Career score (shim → lib/career)
├── analytics/            Analytics engine + event handlers
├── timing/               Time OS (shim → lib/time)
├── notifications/        Scaffold
└── reviews/              Scaffold
```

## Cross-Domain Relationships (PARA)

```
User
 └── Areas (8 life domains)
      └── Goals (vision → annual)
           └── Projects (quarterly)
                └── Tasks
                └── Habits
                └── Resources (Books, Courses, Certs)
```

## Intelligence Dependencies

```
LifeScoreEngine
 ├── dashboard context ← habitPct, goalPct, nutrition, workouts, tasks, savings
 ├── analytics context ← habits, goals, finance, learning, health
 └── areas context ← average of AreaHealthEngine scores

AreaHealthEngine
 ├── goals (progress avg)
 ├── habits (adherence avg)
 ├── tasks (completion %)
 ├── books (progress avg)
 └── domain overrides (body, finance, career, learning)

GoalProgressEngine
 ├── HabitScoreEngine (linked habit adherence)
 ├── task completion
 └── time-based probability
```

## API → Domain Mapping

| API Route | Domain Service |
|-----------|----------------|
| `GET /api/areas/overview` | `areas` + `AreaHealthEngine` |
| `GET /api/areas/[slug]` | `areas` + `loadAreaHub` |
| `GET /api/goals/completion` | `GoalService` |
| `GET /api/finance/wealth` | `FinanceService` |
| `GET /api/v1/analytics` | `analytics` |
| `GET /api/v1/dashboard` | `intelligence` + `dashboard/snapshot` |
| `PATCH /api/habits` | `HabitService` + `HabitCompleted` event |

## State Separation

| State Type | Mechanism | Location |
|------------|-----------|----------|
| **Server** | TanStack Query | `hooks/queries/`, `lifeos-context` |
| **Domain** | Entity instances | `domains/*/entities/` |
| **UI** | React useState | Components only |
