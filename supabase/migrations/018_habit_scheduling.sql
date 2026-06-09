-- 018: Smart Habit Scheduling — frequency_type + frequency_value

alter table public.habits
  add column if not exists frequency_type text not null default 'daily'
    check (frequency_type in ('daily', 'weekly', 'monthly', 'interval', 'custom')),
  add column if not exists frequency_value jsonb not null default '{}'::jsonb;

-- Backfill: non-daily active_days → weekly schedule
update public.habits
set
  frequency_type = 'weekly',
  frequency_value = jsonb_build_object(
    'weekdays',
    active_days
  )
where frequency_type = 'daily'
  and active_days is not null
  and active_days::text != '[0,1,2,3,4,5,6]'
  and jsonb_array_length(active_days) < 7;

create index if not exists idx_habits_frequency on public.habits (user_id, frequency_type);
