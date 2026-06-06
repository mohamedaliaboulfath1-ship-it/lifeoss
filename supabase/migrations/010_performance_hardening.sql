-- LifeOS Pro V1.0 — Performance indexes + account hardening

-- Activity tracking
create index if not exists idx_profiles_last_active
  on public.profiles (last_active_at desc nulls last);

-- Search / filter performance
create index if not exists idx_life_tasks_user_status_due
  on public.life_tasks (user_id, status, due_date);

create index if not exists idx_goals_user_status
  on public.goals (user_id, status);

create index if not exists idx_books_user_status_type
  on public.books (user_id, status, book_type);

create index if not exists idx_habit_logs_user_date
  on public.habit_logs (user_id, log_date desc);

-- Privacy defaults in user_preferences.settings
comment on column public.user_preferences.settings is
  'JSON: { privacy: { profileVisible, analyticsSharing }, locale, ... }';
