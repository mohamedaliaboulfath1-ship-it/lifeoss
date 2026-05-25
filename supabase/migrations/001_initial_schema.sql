-- LifeOS SaaS schema for Supabase (PostgreSQL)
-- Run in Supabase SQL Editor or via: supabase db push

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'مستخدم',
  city text,
  age integer,
  height double precision,
  start_weight double precision,
  target_weight double precision,
  salary double precision,
  target_salary double precision,
  start_date date,
  current_year text not null default to_char(now(), 'YYYY'),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Year-scoped JSON for books, finance, identity, etc.
create table public.life_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);

create table public.goals (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  year text not null,
  title text not null,
  area text not null,
  priority text not null default 'high',
  start_date date,
  due_date date,
  current_val text,
  target_val text,
  unit text,
  done boolean not null default false,
  tasks jsonb not null default '[]'::jsonb,
  habits text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habits (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  year text not null,
  name text not null,
  cat text not null default 'prod',
  freq text not null default 'daily',
  time text,
  dur integer,
  goal_link text,
  note text,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id text not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  unique (habit_id, log_date)
);

create table public.weight_logs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  weight double precision not null,
  sleep double precision,
  cals integer,
  note text,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_date date not null,
  workout_type text,
  duration_min integer,
  energy integer,
  notes text,
  sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_date date not null,
  calories integer,
  protein double precision,
  carbs double precision,
  fat double precision,
  note text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_life_years_user on public.life_years (user_id);
create index idx_goals_user_year on public.goals (user_id, year);
create index idx_habits_user_year on public.habits (user_id, year);
create index idx_habit_logs_habit on public.habit_logs (habit_id);
create index idx_weight_logs_user on public.weight_logs (user_id, log_date desc);
create index idx_workouts_user on public.workouts (user_id, workout_date desc);
create index idx_meals_user on public.meals (user_id, meal_date desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, current_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', 'مستخدم'),
    to_char(now(), 'YYYY')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger life_years_updated_at
  before update on public.life_years
  for each row execute function public.set_updated_at();

create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.life_years enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.meals enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "life_years_all_own" on public.life_years for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_all_own" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_all_own" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_logs_all_own" on public.weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_all_own" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals_all_own" on public.meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
