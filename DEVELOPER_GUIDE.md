# LifeOS Developer Guide

## Quick Start

```bash
npm install
npm run dev          # Development server
npm test             # Domain unit tests (Vitest)
npm run build        # Production build
npm run migrate      # Apply Supabase migrations
```

## Where to Put Code

| What you're building | Where it goes |
|---------------------|---------------|
| Business rule / calculation | `src/domains/{domain}/services/` or `domains/intelligence/engines/` |
| Database query | `src/domains/{domain}/repositories/` |
| Entity with validation | `src/domains/{domain}/entities/` |
| API endpoint | `src/app/api/` — thin, delegates to service |
| UI component | `src/components/` — no business logic |
| Shared types (DTOs) | `src/types/` |
| Domain enums | `src/domains/shared/enums/` |

## Adding a New Domain Module

1. Create folder: `src/domains/my-domain/`
2. Add entity: `entities/my.entity.ts` extending `Entity`
3. Add repository: `repositories/my.repository.ts` implementing data access
4. Add service: `services/my.service.ts` with business logic
5. Export from `index.ts`
6. Register in `src/domains/index.ts`
7. Add Vitest tests: `*.test.ts` alongside service/entity
8. Create lib shim if migrating existing code: `lib/my-domain/` re-exports from domains

## Using Intelligence Engines

```typescript
import { intelligenceService } from "@/domains/intelligence";

// Area health
const { score, reasons } = intelligenceService.areaHealth.calculate({
  domainId: "domain_body",
  goals: [{ progress: 75 }],
  habits: [{ adherencePct: 80 }],
  tasksDone: 5,
  tasksTotal: 10,
  booksProgress: [60],
  bodyProgress: 70,
});

// Life score (context-aware — preserves historical formulas)
const lifeScore = intelligenceService.lifeScore.calculate({
  context: "dashboard",
  habitPct: 80,
  goalPct: 70,
  nutritionPct: 60,
  workoutPct: 50,
  taskPct: 40,
  savingsPct: 30,
});

// Goal completion
import { goalService } from "@/domains/goals";
const completion = goalService.calculateCompletionScore({ goal, linkedHabits, logs });
```

## Repository Pattern

```typescript
import { GoalRepository } from "@/domains/goals";
import { createClient } from "@/lib/supabase/server";

const db = await createClient();
const repo = new GoalRepository(db);
const goals = await repo.findAllActive(userId);
```

Never call `db.from()` directly in React components.

## Domain Events

```typescript
import { eventBus, habitCompletedEvent } from "@/domains/core/event-bus";
import { habitService } from "@/domains/habits";

// Publish
await habitService.completeHabit(userId, habitId, date);

// Subscribe
eventBus.on("HabitCompleted", async (event) => {
  console.log(event.payload);
});
```

## State Management Rules

1. **Server state** → TanStack Query (`hooks/queries/`, staleTime 45–90s)
2. **Domain state** → Entity instances in services (never in React state)
3. **UI state** → `useState` in components (modals, tabs, forms)

## Testing

```bash
npm test              # Run all domain tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Tests live in `src/domains/**/*.test.ts`. Target 80%+ coverage on services and engines.

Example:
```typescript
import { describe, it, expect } from "vitest";
import { habitScoreEngine } from "@/domains/intelligence/engines/habit-score.engine";

it("computes adherence", () => {
  const pct = habitScoreEngine.adherence("h1", { h1: { "2026-06-01": true } }, [0,1,2,3,4,5,6], 7);
  expect(pct).toBeGreaterThanOrEqual(0);
});
```

## Backward Compatibility

Legacy imports from `@/lib/` still work. New code should import from `@/domains/`:

```typescript
// ✅ Preferred
import { calcAreaHealthScore } from "@/domains/intelligence";

// ⚠️ Legacy (still works)
import { calcAreaHealthScore } from "@/lib/areas/scores";
```

## Code Review Checklist

- [ ] No business logic in React components?
- [ ] No direct Supabase in components?
- [ ] Entity has `validate()` method?
- [ ] Service has unit test?
- [ ] Scoring uses intelligence engines (not inline math)?
- [ ] API route is thin (< 30 lines of logic)?
