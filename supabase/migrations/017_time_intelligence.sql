-- 017: Time Intelligence System — schedule, blocks, focus sessions

-- User schedule & capacity settings
create table if not exists public.user_time_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sleep_hours numeric not null default 8 check (sleep_hours between 4 and 12),
  commute_minutes integer not null default 60 check (commute_minutes between 0 and 180),
  work_days smallint[] not null default '{0,1,2,3,4}',
  work_start time not null default '08:30',
  work_end time not null default '16:30',
  sat_work_enabled boolean not null default true,
  sat_work_start time not null default '11:00',
  sat_work_end time not null default '16:00',
  fri_off boolean not null default true,
  home_arrival time not null default '17:00',
  timezone text not null default 'Africa/Cairo',
  updated_at timestamptz not null default now()
);

alter table public.user_time_settings enable row level security;

create policy "user_time_settings_own"
  on public.user_time_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Time blocks (planner)
create table if not exists public.time_blocks (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  block_type text not null default 'task'
    check (block_type in ('task', 'habit', 'deep_work', 'personal', 'meeting', 'break')),
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'done', 'missed', 'rescheduled')),
  domain_id text references public.life_domains (id),
  goal_id text references public.goals (id) on delete set null,
  project_id text,
  task_id text,
  habit_id text references public.habits (id) on delete set null,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  actual_minutes integer check (actual_minutes is null or actual_minutes >= 0),
  is_recurring boolean not null default false,
  recurring_rule jsonb,
  allow_during_work boolean not null default false,
  color text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_time_blocks_user_start on public.time_blocks (user_id, start_at);
create index if not exists idx_time_blocks_user_domain on public.time_blocks (user_id, domain_id);

alter table public.time_blocks enable row level security;

create policy "time_blocks_own"
  on public.time_blocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Focus / deep work sessions
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer not null check (duration_minutes > 0),
  session_type text not null default 'deep_work'
    check (session_type in ('pomodoro_25', 'pomodoro_50', 'deep_90', 'deep_120', 'deep_work', 'custom')),
  domain_id text references public.life_domains (id),
  goal_id text references public.goals (id) on delete set null,
  task_id text,
  time_block_id text references public.time_blocks (id) on delete set null,
  interrupted boolean not null default false,
  focus_score smallint check (focus_score is null or focus_score between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_focus_sessions_user on public.focus_sessions (user_id, started_at);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_own"
  on public.focus_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goal time intelligence
alter table public.goals
  add column if not exists required_hours numeric not null default 0 check (required_hours >= 0),
  add column if not exists logged_hours numeric not null default 0 check (logged_hours >= 0);

-- Habit preferred time slot
alter table public.habits
  add column if not exists preferred_time text
    check (preferred_time is null or preferred_time in ('morning', 'afternoon', 'evening', 'night'));
