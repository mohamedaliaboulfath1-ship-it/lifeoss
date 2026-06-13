# Mohamed Books Library Seed — LifeOS Pro

Professional reading library seed for **محمد علي** (`mohamedaliabouelfath1@gmail.com`).

## Contents

- **50 planned books** across 9 categories
- Real **OpenLibrary** cover URLs (ISBN-based)
- **Priority** (high / med / low) auto-assigned
- **6-phase reading roadmap** stored in book metadata + profile
- **No deletion** of existing books — duplicates skipped by title/id

## Categories

1. Self Development  
2. Productivity  
3. Leadership  
4. Personal Finance  
5. Financial Analysis  
6. Psychology & Decision Making  
7. Communication  
8. Biography  
9. Investment  

## Reading Plan Phases

| Phase | Focus |
|-------|--------|
| 1 | Atomic Habits, Deep Work, Psychology of Money, Richest Man in Babylon |
| 2 | Financial Statement Analysis, Financial Modeling, Investment Banking |
| 3 | Valuation, Corporate Finance, Principles of Corporate Finance |
| 4 | Leadership & Communication |
| 5 | Investment classics |
| 6 | Self-dev, productivity, psychology, biography supplements |

## How to Seed

### Auto (on login)

When محمد opens the app, `/api/data` runs `maybeSeedMohamedBooksLibrary()` if not already seeded.

### API

```bash
POST /api/seed/mohamed-books-library
POST /api/seed/mohamed-books-library?force=1   # retry inserts (still skips duplicates)
```

### CLI

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run seed:books
SEED_USER_EMAIL=you@email.com npm run seed:books -- --force
```

## UI

In **المكتبة**:

- **رف التصنيفات** — shelf grouped by category with priority stars  
- **خطة القراءة** — roadmap by phase with progress  
- **تعديل كتاب** — all fields editable (cover URL, Goodreads, purchase link, phase, etc.)

## Files

| File | Role |
|------|------|
| `src/lib/seed/mohamed-books-library-data.ts` | 50 books + phases |
| `src/lib/seed/run-mohamed-books-library.ts` | Seed runner |
| `src/lib/books/map-book.ts` | metadata ↔ Book mapping |
| `src/components/dashboard/books-library-views.tsx` | Shelf + Roadmap UI |
| `scripts/seed-mohamed-books-library.ts` | CLI entry |

## Metadata (jsonb)

Each seeded book stores in `books.metadata`:

`language`, `description`, `estimatedReadingHours`, `coverUrl`, `publishYear`, `goodreadsRating`, `purchaseUrl`, `readingPhase`, `readingPlanOrder`, `progressPct`, `seedTag`
