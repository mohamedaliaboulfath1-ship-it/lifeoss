-- LifeOS Phase 1: Archive system + user preferences (additive, non-breaking)

-- Frozen year snapshots for historical preservation
create table if not exists public.yearly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year text not null,
  label text,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now(),
  unique (user_id, year)
);

-- Computed yearly metrics for cross-year comparison
create table if not exists public.yearly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);

-- Theme, notifications, and app settings
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  notifications jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_yearly_snapshots_user on public.yearly_snapshots (user_id);
create index if not exists idx_yearly_summaries_user on public.yearly_summaries (user_id);
create index if not exists idx_habit_logs_user on public.habit_logs (user_id);

drop trigger if exists yearly_summaries_updated_at on public.yearly_summaries;
create trigger yearly_summaries_updated_at
  before update on public.yearly_summaries
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.yearly_snapshots enable row level security;
alter table public.yearly_summaries enable row level security;
alter table public.user_preferences enable row level security;

create policy "yearly_snapshots_all_own" on public.yearly_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "yearly_summaries_all_own" on public.yearly_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_preferences_all_own" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Goal progress baseline (fixes 0% on new goals)
alter table public.goals add column if not exists start_val text;
