-- 016: Career Hub V2 — user-controlled paths, skills 0-100, portfolio, readiness

alter table public.skills
  add column if not exists current_pct smallint not null default 0
    check (current_pct between 0 and 100),
  add column if not exists target_pct smallint not null default 80
    check (target_pct between 0 and 100),
  add column if not exists manual_score smallint not null default 0
    check (manual_score between 0 and 100),
  add column if not exists evidence_score smallint not null default 0
    check (evidence_score between 0 and 100),
  add column if not exists scoring_mode text not null default 'hybrid'
    check (scoring_mode in ('manual', 'evidence', 'hybrid'));

alter table public.certifications
  add column if not exists hours integer,
  add column if not exists difficulty text
    check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')),
  add column if not exists start_date date,
  add column if not exists progress_pct integer not null default 0
    check (progress_pct between 0 and 100),
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  add column if not exists career_impact_score integer not null default 50
    check (career_impact_score between 0 and 100);

alter table public.career_milestones
  add column if not exists salary_range text,
  add column if not exists progress_pct integer not null default 0
    check (progress_pct between 0 and 100);

alter table public.portfolio_projects
  add column if not exists outcome text,
  add column if not exists lessons_learned text,
  add column if not exists career_impact integer not null default 0
    check (career_impact between 0 and 100),
  add column if not exists files jsonb not null default '[]'::jsonb,
  add column if not exists links jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists career_seeded boolean not null default false;

-- Migrate legacy 1-10 levels to 0-100 pct
update public.skills
set
  current_pct = least(100, greatest(0, current_level * 10)),
  target_pct = least(100, greatest(0, target_level * 10)),
  manual_score = least(100, greatest(0, current_level * 10))
where current_pct = 0 and current_level > 0;

create table if not exists public.skill_boost_rules (
  id text primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  source_type text not null check (source_type in ('certification', 'course', 'project')),
  source_key text not null,
  skill_key text not null,
  boost_pct numeric(5,2) not null default 5,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_key, skill_key)
);

create index if not exists idx_skill_boost_rules_user on public.skill_boost_rules (user_id, source_type);

alter table public.skill_boost_rules enable row level security;

drop policy if exists "skill_boost_rules_own" on public.skill_boost_rules;
create policy "skill_boost_rules_own" on public.skill_boost_rules
  for all using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

-- Default FMVA / Power BI boost rules (system-wide, user_id null)
insert into public.skill_boost_rules (id, user_id, source_type, source_key, skill_key, boost_pct)
values
  ('boost-fmva-modeling', null, 'certification', 'FMVA', 'Financial Modeling', 15),
  ('boost-fmva-excel', null, 'certification', 'FMVA', 'Excel', 10),
  ('boost-fmva-valuation', null, 'certification', 'FMVA', 'Valuation', 12),
  ('boost-fmva-fpa', null, 'certification', 'FMVA', 'FP&A', 8),
  ('boost-pbi-data', null, 'certification', 'Power BI', 'Data Analysis', 12),
  ('boost-pbi-dash', null, 'certification', 'Power BI', 'Dashboarding', 15),
  ('boost-pbi-bi', null, 'certification', 'Power BI', 'Business Intelligence', 10)
on conflict (id) do nothing;
