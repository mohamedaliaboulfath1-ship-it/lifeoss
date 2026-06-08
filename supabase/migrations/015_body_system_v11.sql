-- 015: Body System V1.1 — goals, extended measurements, exercises, templates

alter table public.profiles
  add column if not exists body_goal text default 'gain'
    check (body_goal in ('gain', 'lose', 'recomp', 'maintain', 'athletic')),
  add column if not exists weekly_gain_target double precision default 0.5,
  add column if not exists fiber_target integer,
  add column if not exists water_target_ml integer default 3000;

alter table public.body_measurements
  add column if not exists neck double precision,
  add column if not exists shoulders double precision,
  add column if not exists forearm double precision,
  add column if not exists body_fat_pct double precision,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

alter table public.exercises
  add column if not exists video_url text,
  add column if not exists difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists notes text;

create table if not exists public.measurement_field_defs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name_ar text not null,
  slug text not null,
  unit text not null default 'cm',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.workout_templates (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  split_type text not null default 'custom'
    check (split_type in ('ppl', 'upper_lower', 'full_body', 'custom')),
  days_per_week int not null default 4,
  schedule jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_measurement_field_defs_user on public.measurement_field_defs (user_id, sort_order);
create index if not exists idx_workout_templates_user on public.workout_templates (user_id);

alter table public.measurement_field_defs enable row level security;
alter table public.workout_templates enable row level security;

drop policy if exists "measurement_field_defs_own" on public.measurement_field_defs;
create policy "measurement_field_defs_own" on public.measurement_field_defs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_templates_own" on public.workout_templates;
create policy "workout_templates_own" on public.workout_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
