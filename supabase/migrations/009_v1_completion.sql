-- LifeOS Pro V1.0 — RBAC, books enrichment, activity logs, AI config

-- ═══ RBAC ═══
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists suspended boolean not null default false,
  add column if not exists last_active_at timestamptz;

create index if not exists idx_profiles_role on public.profiles (role) where role = 'admin';

-- ═══ Books enrichment ═══
alter table public.books
  add column if not exists book_type text not null default 'physical'
    check (book_type in ('physical', 'ebook', 'pdf', 'epub', 'audiobook', 'reference', 'novel', 'course')),
  add column if not exists tags text[] not null default '{}',
  add column if not exists author_image text,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists media_path text;

create table if not exists public.book_highlights (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id text not null references public.books (id) on delete cascade,
  page_number integer,
  excerpt text,
  note text,
  color text default 'yellow',
  created_at timestamptz not null default now()
);

alter table public.book_highlights enable row level security;

create policy "book_highlights_own" on public.book_highlights
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══ Activity log (admin + audit) ═══
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_log_created on public.activity_log (created_at desc);
create index if not exists idx_activity_log_user on public.activity_log (user_id, created_at desc);

alter table public.activity_log enable row level security;

create policy "activity_log_insert_own" on public.activity_log
  for insert to authenticated with check (auth.uid() = user_id);

create policy "activity_log_admin_read" on public.activity_log
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ═══ AI provider config (activation-ready) ═══
create table if not exists public.ai_provider_config (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  provider text not null default 'mock' check (provider in ('mock', 'openai', 'anthropic')),
  model text,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_config enable row level security;

create policy "ai_config_own" on public.ai_provider_config
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══ Admin RLS: admins read all profiles ═══
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ═══ Storage: book media ═══
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-media',
  'book-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/epub+zip']
)
on conflict (id) do nothing;

create policy "book_media_select" on storage.objects for select to authenticated
  using (bucket_id = 'book-media');

create policy "book_media_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'book-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "book_media_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'book-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- Daily scores upsert key
create unique index if not exists idx_daily_scores_user_date
  on public.daily_scores (user_id, score_date);
