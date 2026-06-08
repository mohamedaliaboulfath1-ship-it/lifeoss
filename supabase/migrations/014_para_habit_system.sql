-- 014: PARA + Habit Intelligence + Goal Contribution

alter table public.profiles
  add column if not exists current_weight double precision;

alter table public.habits
  add column if not exists project_id text references public.goals (id) on delete set null,
  add column if not exists why text,
  add column if not exists stop_impact text,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  add column if not exists impact text not null default 'medium'
    check (impact in ('low', 'medium', 'high')),
  add column if not exists active_days jsonb not null default '[0,1,2,3,4,5,6]'::jsonb,
  add column if not exists life_score_weight numeric(4,2) not null default 1.0;

create table if not exists public.goal_habit_links (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id text not null references public.goals (id) on delete cascade,
  habit_id text not null references public.habits (id) on delete cascade,
  weight numeric(4,2) not null default 1.0,
  created_at timestamptz not null default now(),
  unique (goal_id, habit_id)
);

alter table public.goals
  add column if not exists completion_score integer not null default 0
    check (completion_score >= 0 and completion_score <= 100),
  add column if not exists habit_contribution_pct integer not null default 40
    check (habit_contribution_pct >= 0 and habit_contribution_pct <= 100),
  add column if not exists task_contribution_pct integer not null default 40
    check (task_contribution_pct >= 0 and task_contribution_pct <= 100),
  add column if not exists progress_contribution_pct integer not null default 20
    check (progress_contribution_pct >= 0 and progress_contribution_pct <= 100);

create table if not exists public.goal_probability_factors (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id text not null references public.goals (id) on delete cascade,
  factor_date date not null default current_date,
  time_progress_pct numeric(5,2) not null default 0,
  task_progress_pct numeric(5,2) not null default 0,
  habit_adherence_pct numeric(5,2) not null default 0,
  completion_score integer not null default 0,
  success_probability integer not null default 50
    check (success_probability >= 0 and success_probability <= 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (goal_id, factor_date)
);

create table if not exists public.habit_scores (
  habit_id text not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  adherence_pct integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  life_score_impact numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (habit_id, period_start)
);

create table if not exists public.para_resources (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  title text not null,
  resource_type text not null default 'reference'
    check (resource_type in ('note', 'link', 'doc', 'reference')),
  url text,
  content text,
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_habits_project on public.habits (user_id, project_id);
create index if not exists idx_habits_goal on public.habits (user_id, goal_id);
create index if not exists idx_goal_habit_links_goal on public.goal_habit_links (goal_id);
create index if not exists idx_goal_habit_links_habit on public.goal_habit_links (habit_id);
create index if not exists idx_goal_probability_goal on public.goal_probability_factors (goal_id, factor_date desc);
create index if not exists idx_para_resources_user on public.para_resources (user_id, status);

alter table public.goal_habit_links enable row level security;
alter table public.goal_probability_factors enable row level security;
alter table public.habit_scores enable row level security;
alter table public.para_resources enable row level security;

drop policy if exists "goal_habit_links_own" on public.goal_habit_links;
create policy "goal_habit_links_own" on public.goal_habit_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goal_probability_factors_own" on public.goal_probability_factors;
create policy "goal_probability_factors_own" on public.goal_probability_factors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habit_scores_own" on public.habit_scores;
create policy "habit_scores_own" on public.habit_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "para_resources_own" on public.para_resources;
create policy "para_resources_own" on public.para_resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
