-- LifeOS Pro — Migration 005
-- Foundational schema: Life Domains, Goal Hierarchy, Time Horizons,
-- Activity Log, Notifications, Daily Scores, Career Hub stubs, Core v1 entities.
-- Additive and non-breaking. Run after 001–004.

-- ═══════════════════════════════════════════════════════════════
-- 1. REFERENCE TABLES (extensible without schema changes)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.life_domains (
  id text primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  slug text not null,
  name_en text not null,
  name_ar text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  score_weight numeric(5, 2) not null default 1.00,
  is_active boolean not null default true,
  is_system boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_life_domains_system_slug
  on public.life_domains (slug)
  where user_id is null;

create unique index if not exists idx_life_domains_user_slug
  on public.life_domains (user_id, slug)
  where user_id is not null;

create table if not exists public.time_horizons (
  id text primary key,
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  sort_order integer not null default 0,
  days_approx integer,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.entity_types (
  id text primary key,
  label_en text not null,
  label_ar text not null,
  table_name text,
  supports_scoring boolean not null default false,
  supports_notifications boolean not null default true
);

-- Legacy LifeOS_1 category → life_domains mapping (import helper)
create table if not exists public.domain_category_mappings (
  legacy_category text primary key,
  domain_id text not null references public.life_domains (id)
);

-- ═══════════════════════════════════════════════════════════════
-- 2. SEED DATA
-- ═══════════════════════════════════════════════════════════════

insert into public.life_domains (id, user_id, slug, name_en, name_ar, icon, color, sort_order, score_weight, is_system)
values
  ('domain_body', null, 'body', 'Body', 'الجسد', '💪', '#2dd4bf', 1, 1.20, true),
  ('domain_finance', null, 'finance', 'Finance', 'المال', '💰', '#fbbf24', 2, 1.10, true),
  ('domain_career', null, 'career', 'Career', 'المهنة', '📈', '#60a5fa', 3, 1.15, true),
  ('domain_learning', null, 'learning', 'Learning', 'التعلم', '🧠', '#a78bfa', 4, 1.10, true),
  ('domain_relationships', null, 'relationships', 'Relationships', 'العلاقات', '🤝', '#f472b6', 5, 0.90, true),
  ('domain_spiritual', null, 'spiritual', 'Spiritual', 'الروح', '🕌', '#34d399', 6, 1.00, true),
  ('domain_self_dev', null, 'self_development', 'Self Development', 'التطوير الذاتي', '⚡', '#fb923c', 7, 1.00, true),
  ('domain_discipline', null, 'discipline', 'Discipline', 'الانضباط', '🎯', '#e879f9', 8, 1.25, true)
on conflict (id) do nothing;

insert into public.time_horizons (id, slug, name_en, name_ar, sort_order, days_approx)
values
  ('horizon_life_vision', 'life_vision', 'Life Vision', 'رؤية الحياة', 1, null),
  ('horizon_3y', 'three_year', '3 Years', '3 سنوات', 2, 1095),
  ('horizon_annual', 'annual', 'Annual', 'سنوي', 3, 365),
  ('horizon_quarterly', 'quarterly', 'Quarterly', 'ربع سنوي', 4, 90),
  ('horizon_monthly', 'monthly', 'Monthly', 'شهري', 5, 30)
on conflict (id) do nothing;

insert into public.entity_types (id, label_en, label_ar, table_name, supports_scoring, supports_notifications)
values
  ('goal', 'Goal', 'هدف', 'goals', true, true),
  ('habit', 'Habit', 'عادة', 'habits', true, true),
  ('task', 'Task', 'مهمة', 'life_tasks', true, true),
  ('weight_log', 'Weight Log', 'سجل وزن', 'weight_logs', true, false),
  ('measurement', 'Measurement', 'قياس', 'body_measurements', true, false),
  ('workout_set', 'Workout Set', 'مجموعة تمرين', 'workout_set_logs', true, false),
  ('meal_log', 'Meal Log', 'وجبة', 'meal_logs', true, false),
  ('book', 'Book', 'كتاب', 'books', true, true),
  ('transaction', 'Transaction', 'معاملة', 'transactions', true, true),
  ('debt', 'Debt', 'دين', 'debts', true, true),
  ('journal', 'Daily Journal', 'يومية', 'daily_journals', true, false),
  ('certification', 'Certification', 'شهادة', 'certifications', true, true),
  ('course', 'Course', 'دورة', 'courses', true, true),
  ('skill', 'Skill', 'مهارة', 'skills', true, true),
  ('job_application', 'Job Application', 'طلب وظيفة', 'job_applications', true, true),
  ('notification', 'Notification', 'إشعار', 'notifications', false, false)
on conflict (id) do nothing;

insert into public.domain_category_mappings (legacy_category, domain_id)
values
  ('health', 'domain_body'),
  ('body', 'domain_body'),
  ('finance', 'domain_finance'),
  ('career', 'domain_career'),
  ('learning', 'domain_learning'),
  ('relationships', 'domain_relationships'),
  ('spiritual', 'domain_spiritual'),
  ('self_dev', 'domain_self_dev'),
  ('self', 'domain_self_dev'),
  ('discipline', 'domain_discipline'),
  ('mind', 'domain_learning'),
  ('relation', 'domain_relationships'),
  ('spirit', 'domain_spiritual'),
  ('prod', 'domain_discipline')
on conflict (legacy_category) do nothing;

-- ═══════════════════════════════════════════════════════════════
-- 3. PROFILES EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists vision_3y jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists life_start_date date;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- 4. GOALS — Hierarchy + LifeOS v1 fields + domains
-- Vision → Goal → Project (tasks link to projects)
-- ═══════════════════════════════════════════════════════════════

alter table public.goals add column if not exists domain_id text references public.life_domains (id);
alter table public.goals add column if not exists parent_id text references public.goals (id) on delete set null;
alter table public.goals add column if not exists level text not null default 'goal'
  check (level in ('vision', 'goal', 'project'));
alter table public.goals add column if not exists time_horizon_id text references public.time_horizons (id);
alter table public.goals add column if not exists category text;
alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists why text;
alter table public.goals add column if not exists success_criteria text;
alter table public.goals add column if not exists status text not null default 'active'
  check (status in ('active', 'done', 'paused', 'cancelled'));
alter table public.goals add column if not exists progress integer not null default 0
  check (progress >= 0 and progress <= 100);
alter table public.goals add column if not exists target_date date;
alter table public.goals add column if not exists legacy_id integer;
alter table public.goals add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_goals_parent on public.goals (parent_id);
create index if not exists idx_goals_domain on public.goals (domain_id);
create index if not exists idx_goals_level on public.goals (user_id, level);
create index if not exists idx_goals_horizon on public.goals (time_horizon_id);
create unique index if not exists idx_goals_user_legacy on public.goals (user_id, legacy_id)
  where legacy_id is not null;

-- ═══════════════════════════════════════════════════════════════
-- 5. HABITS EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

alter table public.habits add column if not exists domain_id text references public.life_domains (id);
alter table public.habits add column if not exists category text;
alter table public.habits add column if not exists frequency text;
alter table public.habits add column if not exists time_of_day text;
alter table public.habits add column if not exists target_count integer;
alter table public.habits add column if not exists active boolean not null default true;
alter table public.habits add column if not exists streak integer not null default 0;
alter table public.habits add column if not exists best_streak integer not null default 0;
alter table public.habits add column if not exists goal_id text references public.goals (id) on delete set null;
alter table public.habits add column if not exists legacy_id integer;
alter table public.habits add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.habits add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_habits_domain on public.habits (domain_id);
create index if not exists idx_habits_goal on public.habits (goal_id);

drop trigger if exists habits_updated_at on public.habits;
create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

alter table public.habit_logs add column if not exists notes text;
alter table public.habit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.habit_logs add column if not exists created_at timestamptz not null default now();

alter table public.weight_logs add column if not exists domain_id text not null default 'domain_body'
  references public.life_domains (id);
alter table public.weight_logs add column if not exists legacy_id integer;
alter table public.weight_logs add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- 6. CORE LIFEOS v1 ENTITIES (relational — out of life_years.payload)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.life_tasks (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  title text not null,
  priority text not null default 'p3' check (priority in ('p1', 'p2', 'p3', 'p4')),
  status text not null default 'inbox'
    check (status in ('inbox', 'active', 'done', 'archive')),
  due_date date,
  estimated_time integer,
  goal_id text references public.goals (id) on delete set null,
  completed_date date,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  measure_date date not null,
  chest double precision,
  arm double precision,
  waist double precision,
  thigh double precision,
  calf double precision,
  body_fat double precision,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  photo_date date not null,
  weight double precision,
  notes text,
  storage_path text,
  thumbnail_path text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  name text not null,
  muscle_group text,
  equipment text,
  notes text,
  is_custom boolean not null default true,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_set_logs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  log_date date not null,
  exercise_id text references public.exercises (id) on delete set null,
  weight double precision,
  reps integer,
  sets integer,
  rpe integer,
  rest_time integer,
  workout_type text,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.foods (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  name text not null,
  portion text,
  calories double precision not null default 0,
  protein double precision not null default 0,
  carbs double precision not null default 0,
  fats double precision not null default 0,
  category text,
  is_custom boolean not null default true,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_body' references public.life_domains (id),
  log_date date not null,
  log_time time,
  meal_name text,
  food_id text references public.foods (id) on delete set null,
  food_name text,
  multiplier double precision not null default 1,
  calories double precision not null default 0,
  protein double precision not null default 0,
  carbs double precision not null default 0,
  fats double precision not null default 0,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  title text not null,
  author text,
  category text,
  status text not null default 'planned'
    check (status in ('planned', 'reading', 'done')),
  priority text default 'med' check (priority in ('high', 'med', 'low')),
  pages_total integer,
  pages_read integer not null default 0,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  start_date date,
  finish_date date,
  goal_id text references public.goals (id) on delete set null,
  cover_path text,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_logs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_learning' references public.life_domains (id),
  book_id text not null references public.books (id) on delete cascade,
  log_date date not null,
  pages integer not null default 0,
  duration_min integer,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  tx_date date not null,
  type text not null check (type in ('income', 'expense', 'savings')),
  amount double precision not null,
  category text,
  description text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  name text not null,
  debt_type text not null default 'installment'
    check (debt_type in ('installment', 'loan', 'credit_card')),
  amount double precision not null default 0,
  remaining_amount double precision not null default 0,
  monthly_payment double precision,
  due_date date,
  status text not null default 'active' check (status in ('active', 'paid')),
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  category text not null,
  monthly_limit double precision not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

create table if not exists public.daily_journals (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_self_dev' references public.life_domains (id),
  journal_date date not null,
  mood_score integer check (mood_score is null or (mood_score between 1 and 5)),
  gratitudes text,
  wins text,
  lesson text,
  tomorrow_plan text,
  notes text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, journal_date)
);

create table if not exists public.weekly_reviews (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_date date not null,
  wins text,
  failures text,
  time_thieves text,
  biggest_lesson text,
  next_week_focus text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_reviews (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_date date not null,
  month_name text,
  top_wins text,
  area_ratings text,
  lessons text,
  stop_doing text,
  start_doing text,
  next_focus text,
  legacy_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 7. PLATFORM TABLES — Activity, Notifications, Scores, Dashboard
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text not null references public.entity_types (id),
  entity_id text not null,
  domain_id text references public.life_domains (id),
  action text not null check (action in ('create', 'update', 'delete', 'complete', 'archive', 'restore')),
  summary text,
  changes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('alert', 'insight', 'reminder', 'deadline', 'achievement', 'system')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  title text not null,
  body text,
  domain_id text references public.life_domains (id),
  entity_type text references public.entity_types (id),
  entity_id text,
  action_url text,
  read_at timestamptz,
  dismissed_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score_date date not null,
  discipline_score smallint check (discipline_score is null or (discipline_score between 0 and 100)),
  health_score smallint check (health_score is null or (health_score between 0 and 100)),
  finance_score smallint check (finance_score is null or (finance_score between 0 and 100)),
  learning_score smallint check (learning_score is null or (learning_score between 0 and 100)),
  career_score smallint check (career_score is null or (career_score between 0 and 100)),
  relationships_score smallint check (relationships_score is null or (relationships_score between 0 and 100)),
  spiritual_score smallint check (spiritual_score is null or (spiritual_score between 0 and 100)),
  life_score smallint check (life_score is null or (life_score between 0 and 100)),
  factors jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (user_id, score_date)
);

create table if not exists public.score_weights (
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null references public.life_domains (id),
  weight numeric(5, 2) not null default 1.00,
  updated_at timestamptz not null default now(),
  primary key (user_id, domain_id)
);

-- 30-second dashboard cache: priorities + snapshot
create table if not exists public.dashboard_snapshots (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  greeting text,
  priorities jsonb not null default '[]'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 8. CAREER & LEARNING HUB (stubs — ready for future UI)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.career_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  "current_role" text,
  target_role text,
  target_salary double precision,
  transformation_narrative text,
  target_date date,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.career_milestones (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  stage_order integer not null default 0,
  title text not null,
  description text,
  target_date date,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'done', 'paused')),
  linked_goal_id text references public.goals (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  name text not null,
  issuer text,
  status text not null default 'planned'
    check (status in ('planned', 'studying', 'registered', 'passed', 'expired')),
  exam_date date,
  cost double precision,
  linked_goal_id text references public.goals (id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  platform text,
  title text not null,
  category text,
  total_hours double precision,
  hours_completed double precision not null default 0,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'done', 'paused')),
  start_date date,
  finish_date date,
  skill_tags text[] not null default '{}',
  linked_goal_id text references public.goals (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  name text not null,
  category text,
  current_level smallint not null default 1 check (current_level between 1 and 10),
  target_level smallint not null default 5 check (target_level between 1 and 10),
  hours_practiced double precision not null default 0,
  last_practiced_date date,
  linked_goal_id text references public.goals (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  title text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'done', 'paused')),
  skills_used text[] not null default '{}',
  url text,
  start_date date,
  finish_date date,
  linked_goal_id text references public.goals (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  company text not null,
  role_title text not null,
  status text not null default 'applied'
    check (status in ('wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn')),
  applied_date date,
  salary_range text,
  location text,
  job_url text,
  notes text,
  linked_goal_id text references public.goals (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  job_application_id text references public.job_applications (id) on delete cascade,
  interview_date timestamptz not null,
  interview_type text not null default 'phone'
    check (interview_type in ('phone', 'video', 'onsite', 'technical', 'hr', 'final', 'other')),
  interviewer text,
  outcome text check (outcome is null or outcome in ('pending', 'passed', 'failed', 'rescheduled', 'cancelled')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.networking_contacts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  name text not null,
  company text,
  role_title text,
  email text,
  phone text,
  linkedin_url text,
  relationship text,
  last_contact_date date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentors (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_career' references public.life_domains (id),
  name text not null,
  expertise text,
  company text,
  contact_method text,
  meeting_frequency text,
  last_meeting_date date,
  next_meeting_date date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 9. AI STUBS (future — no UI yet)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text references public.life_domains (id),
  insight_type text not null,
  title text not null,
  content text not null,
  factors jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.goal_forecasts (
  id uuid primary key default gen_random_uuid(),
  goal_id text not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  probability smallint check (probability between 0 and 100),
  label text,
  factors jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_type text not null default 'daily',
  messages jsonb not null default '[]'::jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- 10. INDEXES
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_life_tasks_user on public.life_tasks (user_id, status);
create index if not exists idx_life_tasks_due on public.life_tasks (user_id, due_date);
create index if not exists idx_life_tasks_goal on public.life_tasks (goal_id);
create index if not exists idx_body_measurements_user on public.body_measurements (user_id, measure_date desc);
create index if not exists idx_progress_photos_user on public.progress_photos (user_id, photo_date desc);
create index if not exists idx_workout_set_logs_user on public.workout_set_logs (user_id, log_date desc);
create index if not exists idx_workout_set_logs_exercise on public.workout_set_logs (exercise_id);
create index if not exists idx_meal_logs_user on public.meal_logs (user_id, log_date desc);
create index if not exists idx_books_user on public.books (user_id, status);
create index if not exists idx_reading_logs_book on public.reading_logs (book_id);
create index if not exists idx_transactions_user on public.transactions (user_id, tx_date desc);
create index if not exists idx_debts_user on public.debts (user_id, status);
create index if not exists idx_activity_log_user on public.activity_log (user_id, created_at desc);
create index if not exists idx_activity_log_entity on public.activity_log (entity_type, entity_id);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (user_id)
  where read_at is null and dismissed_at is null;
create index if not exists idx_daily_scores_user on public.daily_scores (user_id, score_date desc);
create index if not exists idx_job_applications_user on public.job_applications (user_id, status);
create index if not exists idx_interviews_user on public.interviews (user_id, interview_date);
create index if not exists idx_skills_user on public.skills (user_id);

-- ═══════════════════════════════════════════════════════════════
-- 11. TRIGGERS — updated_at
-- ═══════════════════════════════════════════════════════════════

drop trigger if exists life_tasks_updated_at on public.life_tasks;
create trigger life_tasks_updated_at before update on public.life_tasks
  for each row execute function public.set_updated_at();

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists debts_updated_at on public.debts;
create trigger debts_updated_at before update on public.debts
  for each row execute function public.set_updated_at();

drop trigger if exists career_profiles_updated_at on public.career_profiles;
create trigger career_profiles_updated_at before update on public.career_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists certifications_updated_at on public.certifications;
create trigger certifications_updated_at before update on public.certifications
  for each row execute function public.set_updated_at();

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

drop trigger if exists portfolio_projects_updated_at on public.portfolio_projects;
create trigger portfolio_projects_updated_at before update on public.portfolio_projects
  for each row execute function public.set_updated_at();

drop trigger if exists job_applications_updated_at on public.job_applications;
create trigger job_applications_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

drop trigger if exists networking_contacts_updated_at on public.networking_contacts;
create trigger networking_contacts_updated_at before update on public.networking_contacts
  for each row execute function public.set_updated_at();

drop trigger if exists mentors_updated_at on public.mentors;
create trigger mentors_updated_at before update on public.mentors
  for each row execute function public.set_updated_at();

drop trigger if exists score_weights_updated_at on public.score_weights;
create trigger score_weights_updated_at before update on public.score_weights
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.life_domains enable row level security;
alter table public.time_horizons enable row level security;
alter table public.entity_types enable row level security;
alter table public.domain_category_mappings enable row level security;
alter table public.life_tasks enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_set_logs enable row level security;
alter table public.foods enable row level security;
alter table public.meal_logs enable row level security;
alter table public.books enable row level security;
alter table public.reading_logs enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.budgets enable row level security;
alter table public.daily_journals enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;
alter table public.daily_scores enable row level security;
alter table public.score_weights enable row level security;
alter table public.dashboard_snapshots enable row level security;
alter table public.career_profiles enable row level security;
alter table public.career_milestones enable row level security;
alter table public.certifications enable row level security;
alter table public.courses enable row level security;
alter table public.skills enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.job_applications enable row level security;
alter table public.interviews enable row level security;
alter table public.networking_contacts enable row level security;
alter table public.mentors enable row level security;
alter table public.insights enable row level security;
alter table public.goal_forecasts enable row level security;
alter table public.coach_sessions enable row level security;

-- Reference tables: read-only for authenticated users
create policy "life_domains_read" on public.life_domains for select to authenticated
  using (user_id is null or auth.uid() = user_id);
create policy "life_domains_insert_own" on public.life_domains for insert to authenticated
  with check (auth.uid() = user_id and is_system = false);
create policy "life_domains_update_own" on public.life_domains for update to authenticated
  using (auth.uid() = user_id and is_system = false);
create policy "life_domains_delete_own" on public.life_domains for delete to authenticated
  using (auth.uid() = user_id and is_system = false);

create policy "time_horizons_read" on public.time_horizons for select to authenticated using (true);
create policy "entity_types_read" on public.entity_types for select to authenticated using (true);
create policy "domain_mappings_read" on public.domain_category_mappings for select to authenticated using (true);

-- User-owned tables macro
do $$
declare
  t text;
begin
  foreach t in array array[
    'life_tasks', 'body_measurements', 'progress_photos', 'exercises',
    'workout_set_logs', 'foods', 'meal_logs', 'books', 'reading_logs',
    'transactions', 'debts', 'budgets', 'daily_journals', 'weekly_reviews',
    'monthly_reviews', 'activity_log', 'notifications', 'daily_scores',
    'score_weights', 'dashboard_snapshots', 'career_milestones',
    'certifications', 'courses', 'skills', 'portfolio_projects',
    'job_applications', 'interviews', 'networking_contacts', 'mentors',
    'insights', 'goal_forecasts', 'coach_sessions'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_all_own', t
    );
  end loop;
end $$;

create policy "career_profiles_all_own" on public.career_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 13. HELPER: resolve legacy category → domain_id
-- ═══════════════════════════════════════════════════════════════

create or replace function public.resolve_domain_id(p_category text)
returns text
language sql
stable
as $$
  select coalesce(
    (select domain_id from public.domain_category_mappings where legacy_category = lower(trim(p_category))),
    'domain_self_dev'
  );
$$;

-- ═══════════════════════════════════════════════════════════════
-- 14. SEED default score weights for new users (via trigger)
-- ═══════════════════════════════════════════════════════════════

create or replace function public.seed_user_score_weights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.score_weights (user_id, domain_id, weight)
  select new.id, d.id, d.score_weight
  from public.life_domains d
  where d.user_id is null and d.is_active = true
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_seed_score_weights on public.profiles;
create trigger on_profile_seed_score_weights
  after insert on public.profiles
  for each row execute function public.seed_user_score_weights();

-- Backfill score weights for existing profiles
insert into public.score_weights (user_id, domain_id, weight)
select p.id, d.id, d.score_weight
from public.profiles p
cross join public.life_domains d
where d.user_id is null and d.is_active = true
on conflict do nothing;
