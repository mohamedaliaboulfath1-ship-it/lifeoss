-- LifeOS v1 HTML parity: profile nutrition targets + optional JSON indexes

alter table public.profiles add column if not exists daily_calories integer default 3000;
alter table public.profiles add column if not exists protein_target integer default 130;
alter table public.profiles add column if not exists carbs_target integer default 350;
alter table public.profiles add column if not exists fats_target integer default 90;
