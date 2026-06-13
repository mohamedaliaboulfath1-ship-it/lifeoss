# Journal OS — Second Brain Deliverables

## Summary

`/resources` is upgraded to **Journal OS** at `/journal` — a Notion-inspired writing and knowledge hub fully integrated with LifeOS. All existing APIs and tables (`para_resources`, `/api/resources`) remain intact.

## Routes

| Route | Purpose |
|-------|---------|
| `/journal` | Knowledge hub — search, categories, templates, daily notes |
| `/journal/[id]` | Block editor + article view + AI tools |
| `/journal/graph` | React Flow knowledge graph |
| `/resources` | Redirects → `/journal` |

## Database (Migration 021)

| Table | Purpose |
|-------|---------|
| `journal_entries` | Articles, metadata, word count, reading time |
| `journal_blocks` | Block editor content |
| `journal_relations` | @mentions → goals, tasks, books, habits, areas |
| `journal_images` | Image attachments |
| `journal_tags` | Tags |
| `journal_templates` | System + user templates |

Storage bucket: `journal-media` (RLS per user folder)

Run: `npm run migrate`

## Editor Features

- **Slash commands** (`/heading1`, `/checklist`, `/image`, `/goal`, etc.)
- **@ mentions** — links to Goals, Projects, Tasks, Books, Habits, Areas
- **Rich text** — Bold, Italic, Underline, Highlight, Strikethrough, Code (Ctrl+B/I/U)
- **Drag & drop** block reorder (dnd-kit)
- **Images** — upload, drag-drop, captions, full-width
- **Reading mode** — distraction-free article view
- **Auto-save** — debounced PATCH every 1.5s

## Templates (System)

- Daily Review
- Weekly Review
- Monthly Review

## AI Tools (Architecture-ready)

Summarize, Rewrite, Expand, Translate, Extract Tasks/Goals/Habits, Action Plan — rule-based stubs in `src/lib/journal/ai.ts`, ready for OpenAI via `src/lib/ai/provider.ts`.

## LifeOS Integration

- `journal_relations` stores real DB links to entities
- Life Map resource nodes link to `/journal`
- Navigation: Journal OS in sidebar (replaces Resources label)
- `para_resources` API unchanged for backward compatibility

## Performance

- Dynamic imports on all journal pages
- Lazy-loaded editor and graph
- Debounced saves (no save storm)

## Files Added

- `supabase/migrations/021_journal_os.sql`
- `src/types/journal.ts`
- `src/lib/journal/*`
- `src/app/api/journal/**`
- `src/components/journal/**`
- `src/app/(dashboard)/journal/**`

## Verification

1. Run migration 021
2. Open `/journal` → create note
3. Type `/` for commands, `@` for mentions
4. Complete task → open `/journal/graph`
5. `/resources` redirects to `/journal`
6. Mohamed's existing data untouched
