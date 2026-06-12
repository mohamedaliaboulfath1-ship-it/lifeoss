-- LifeOS Pro — Performance indexes v2 (query audit)

-- Goals: domain + status filters (areas, goals pages)
create index if not exists idx_goals_user_domain_status
  on public.goals (user_id, domain_id, status);

create index if not exists idx_goals_user_parent
  on public.goals (user_id, parent_id)
  where parent_id is not null;

-- Habits: domain linkage + active filter
create index if not exists idx_habits_user_active_domain
  on public.habits (user_id, active, domain_id);

create index if not exists idx_habits_user_goal
  on public.habits (user_id, goal_id)
  where goal_id is not null;

create index if not exists idx_habits_user_project
  on public.habits (user_id, project_id)
  where project_id is not null;

-- Tasks: area + due date (dashboard, areas)
create index if not exists idx_life_tasks_user_domain_status
  on public.life_tasks (user_id, domain_id, status);

create index if not exists idx_life_tasks_user_goal
  on public.life_tasks (user_id, goal_id)
  where goal_id is not null;

-- Books / courses / certs: domain scoping
create index if not exists idx_books_user_domain
  on public.books (user_id, domain_id);

create index if not exists idx_courses_user_domain
  on public.courses (user_id, domain_id);

create index if not exists idx_certifications_user_domain
  on public.certifications (user_id, domain_id);

-- Temporal queries
create index if not exists idx_weight_logs_user_date
  on public.weight_logs (user_id, log_date desc);

create index if not exists idx_reading_logs_user_date
  on public.reading_logs (user_id, log_date desc);

create index if not exists idx_study_sessions_user_date
  on public.study_sessions (user_id, session_date desc);

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, tx_date desc);

-- Life domains lookup
create index if not exists idx_life_domains_user_active
  on public.life_domains (user_id, is_active, sort_order);
