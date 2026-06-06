-- Phase 0.5: Complete relational storage (learning hub + period reviews)
-- Run after 005 + 006. No feature changes — data layer only.

create table if not exists public.learning_paths (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  target_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  session_date date not null,
  duration_min integer not null default 0,
  focus_score integer check (focus_score is null or (focus_score between 1 and 10)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_areas (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  progress integer not null default 0,
  target integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.period_reviews (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_date date not null,
  period text not null check (period in ('quarterly', 'annual')),
  wins text,
  challenges text,
  lessons text,
  next_focus text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_paths_user on public.learning_paths (user_id);
create index if not exists idx_study_sessions_user on public.study_sessions (user_id, session_date desc);
create index if not exists idx_knowledge_areas_user on public.knowledge_areas (user_id);
create index if not exists idx_period_reviews_user on public.period_reviews (user_id, period);

drop trigger if exists learning_paths_updated_at on public.learning_paths;
create trigger learning_paths_updated_at before update on public.learning_paths
  for each row execute function public.set_updated_at();

drop trigger if exists knowledge_areas_updated_at on public.knowledge_areas;
create trigger knowledge_areas_updated_at before update on public.knowledge_areas
  for each row execute function public.set_updated_at();

alter table public.learning_paths enable row level security;
alter table public.study_sessions enable row level security;
alter table public.knowledge_areas enable row level security;
alter table public.period_reviews enable row level security;

create policy "learning_paths_all_own" on public.learning_paths
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study_sessions_all_own" on public.study_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "knowledge_areas_all_own" on public.knowledge_areas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "period_reviews_all_own" on public.period_reviews
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Deprecate life_years.payload as data store (keep column, empty object)
update public.life_years set payload = '{}'::jsonb where payload is distinct from '{}'::jsonb;
