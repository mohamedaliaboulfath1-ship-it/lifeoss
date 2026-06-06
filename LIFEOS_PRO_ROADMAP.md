# LifeOS Pro — Post V1.0 Roadmap

Strategic roadmap after LifeOS Pro **V1.0** release. Items are prioritized by user impact and technical dependency.

**V1.0 shipped:** Relational architecture, entity APIs, admin RBAC, analytics, search, PWA, mock AI, export/import.

---

## Phase 1 — AI Activation (Q2)

| Item | Description |
|------|-------------|
| OpenAI integration | Wire `OpenAiProvider` to GPT-4o for insights, brief, coach |
| Anthropic integration | Claude for long-context coaching sessions |
| User AI settings UI | Enable provider, select model in `/ai` + `ai_provider_config` |
| Cost controls | Per-user token budgets, caching of daily briefs |

**Dependency:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` on Vercel.

---

## Phase 2 — API Completeness (Q2–Q3)

| Item | Description |
|------|-------------|
| Career CRUD | GET/PATCH/DELETE on `/api/career` for all entity types |
| Learning CRUD | Full REST for paths, knowledge areas, sessions |
| JSON restore | `POST /api/v1/import/lifeos-pro` for native JSON export round-trip |
| Pagination | Cursor-based lists for tasks, notifications, admin users |
| OpenAPI spec | Machine-readable API docs + client SDK |

---

## Phase 3 — Mobile & Offline (Q3)

| Item | Description |
|------|-------------|
| Offline queue | IndexedDB write queue for habits/tasks when offline |
| Push notifications | Web Push via service worker + Supabase edge function |
| Native shell | Capacitor / TWA wrapper for app store distribution |
| Haptic & widgets | Quick habit check-in from home screen |

---

## Phase 4 — Collaboration & Sharing (Q4)

| Item | Description |
|------|-------------|
| Accountability partners | Read-only share of habit streaks |
| Coach role | Third-party mentor with scoped access |
| Family workspace | Shared finance goals (separate tenant model) |

---

## Phase 5 — Monetization (Q4+)

| Item | Description |
|------|-------------|
| Subscription tiers | Free / Pro / Team via Stripe |
| `profiles.subscription` | Feature gates (AI, export formats, archive count) |
| Billing portal | `/account/subscription` integration (page stub exists) |

---

## Phase 6 — Intelligence Layer (2027)

| Item | Description |
|------|-------------|
| Predictive analytics | Goal completion forecasts (`goal_forecasts` table ready) |
| Anomaly detection | Spending spikes, habit drop-off alerts |
| Natural language input | "Add task: call dentist Friday" → structured entity |
| Arabic NLP | RTL-aware voice input for journal entries |

---

## Phase 7 — Enterprise & Compliance

| Item | Description |
|------|-------------|
| SSO (SAML/OIDC) | Supabase enterprise auth |
| Audit export | Admin CSV of activity_log |
| Data residency | EU/MENA Supabase region option |
| Automated backups | Scheduled user email exports |

---

## Technical Debt to Clear (Pre-Phase 2)

1. Unify `meals` (001) and `meal_logs` (005) — deprecate legacy table.
2. Replace fuzzy in-memory search with Postgres full-text or pg_trgm.
3. Add structured 400 responses for Zod validation errors.
4. Middleware auth gate for sensitive `/api/admin` (defense in depth).
5. Implement account deletion cascade + storage cleanup.
6. Rate limiting on auth and export endpoints.

---

## Success Metrics

| Metric | V1 Baseline | Phase 2 Target |
|--------|-------------|----------------|
| Weekly active users | Track via `last_active_at` | +30% |
| Habit completion rate | `habit_logs` / active habits | +15% |
| Export/import success | Import report error rate | < 1% |
| PWA installs | Analytics event (future) | 500+ |
| AI activation | `ai_provider_config.enabled` | 20% of Pro users |

---

## Out of Scope (V1.x)

- Multi-tenant B2B admin console
- Real-time collaborative editing
- Third-party integrations (Notion, Google Calendar) — deferred to Phase 6+
- Custom user-defined entity types (metadata-only in `entity_types`)
