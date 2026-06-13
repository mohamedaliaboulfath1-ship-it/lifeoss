-- Journal OS / Second Brain — additive, multi-tenant RLS

-- Main journal entries (articles / daily notes)
create table if not exists public.journal_entries (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'بدون عنوان',
  subtitle text,
  author text,
  category text not null default 'journal'
    check (category in (
      'personal', 'career', 'finance', 'learning', 'books',
      'ideas', 'projects', 'research', 'journal'
    )),
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_daily boolean not null default false,
  journal_date date,
  word_count integer not null default 0,
  reading_time_min integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_journal_daily_unique
  on public.journal_entries (user_id, journal_date)
  where is_daily = true and journal_date is not null;

create index if not exists idx_journal_entries_user on public.journal_entries (user_id, updated_at desc);
create index if not exists idx_journal_entries_category on public.journal_entries (user_id, category);
create index if not exists idx_journal_entries_status on public.journal_entries (user_id, status);

-- Block content (Notion-style)
create table if not exists public.journal_blocks (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id text not null references public.journal_entries (id) on delete cascade,
  block_type text not null,
  content text not null default '',
  sort_order integer not null default 0,
  parent_id text references public.journal_blocks (id) on delete cascade,
  checked boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_blocks_entry on public.journal_blocks (entry_id, sort_order);

-- LifeOS entity relations (@mentions)
create table if not exists public.journal_relations (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id text not null references public.journal_entries (id) on delete cascade,
  block_id text references public.journal_blocks (id) on delete set null,
  target_type text not null check (target_type in ('goal', 'project', 'task', 'book', 'habit', 'area')),
  target_id text not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_relations_entry on public.journal_relations (entry_id);
create index if not exists idx_journal_relations_target on public.journal_relations (user_id, target_type, target_id);

-- Images attached to entries/blocks
create table if not exists public.journal_images (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id text not null references public.journal_entries (id) on delete cascade,
  block_id text references public.journal_blocks (id) on delete set null,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  full_width boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_images_entry on public.journal_images (entry_id, sort_order);

-- Tags
create table if not exists public.journal_tags (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id text not null references public.journal_entries (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_tags_entry on public.journal_tags (entry_id);
create index if not exists idx_journal_tags_tag on public.journal_tags (user_id, tag);

-- Templates (system + user)
create table if not exists public.journal_templates (
  id text primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  category text not null default 'journal',
  description text,
  blocks jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.journal_entries enable row level security;
alter table public.journal_blocks enable row level security;
alter table public.journal_relations enable row level security;
alter table public.journal_images enable row level security;
alter table public.journal_tags enable row level security;
alter table public.journal_templates enable row level security;

create policy "journal_entries_own" on public.journal_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_blocks_own" on public.journal_blocks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_relations_own" on public.journal_relations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_images_own" on public.journal_images
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_tags_own" on public.journal_tags
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_templates_read" on public.journal_templates
  for select to authenticated
  using (is_system = true or auth.uid() = user_id);

create policy "journal_templates_write" on public.journal_templates
  for insert to authenticated with check (auth.uid() = user_id and is_system = false);

create policy "journal_templates_update" on public.journal_templates
  for update to authenticated using (auth.uid() = user_id and is_system = false);

create policy "journal_templates_delete" on public.journal_templates
  for delete to authenticated using (auth.uid() = user_id and is_system = false);

-- Updated_at triggers
drop trigger if exists journal_entries_updated_at on public.journal_entries;
create trigger journal_entries_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists journal_blocks_updated_at on public.journal_blocks;
create trigger journal_blocks_updated_at before update on public.journal_blocks
  for each row execute function public.set_updated_at();

-- Storage bucket for journal media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-media',
  'journal-media',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "journal_media_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_media_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_media_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "journal_media_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- System templates
insert into public.journal_templates (id, user_id, name, category, description, blocks, is_system)
values
  (
    'tpl_daily_review',
    null,
    'مراجعة يومية',
    'journal',
    'Daily Review — ماذا أنجزت؟ ما الذي عطّلك؟',
    '[
      {"type":"heading2","content":"ماذا أنجزت اليوم؟"},
      {"type":"text","content":""},
      {"type":"heading2","content":"ما الذي عطّلني؟"},
      {"type":"text","content":""},
      {"type":"heading2","content":"ماذا تعلّمت؟"},
      {"type":"text","content":""},
      {"type":"heading2","content":"أولوية الغد"},
      {"type":"checklist","content":"مهمة 1","checked":false}
    ]'::jsonb,
    true
  ),
  (
    'tpl_weekly_review',
    null,
    'مراجعة أسبوعية',
    'journal',
    'Weekly Review',
    '[
      {"type":"heading2","content":"انتصارات الأسبوع"},
      {"type":"bullet","content":"","items":["",""]},
      {"type":"heading2","content":"إخفاقات / دروس"},
      {"type":"text","content":""},
      {"type":"heading2","content":"خطة الأسبوع القادم"},
      {"type":"numbered","content":"","items":["","",""]}
    ]'::jsonb,
    true
  ),
  (
    'tpl_monthly_review',
    null,
    'مراجعة شهرية',
    'journal',
    'Monthly Review — صحة · مال · مهنة · تعلّم',
    '[
      {"type":"heading2","content":"الصحة"},
      {"type":"text","content":""},
      {"type":"heading2","content":"المال"},
      {"type":"text","content":""},
      {"type":"heading2","content":"المهنة"},
      {"type":"text","content":""},
      {"type":"heading2","content":"التعلّم"},
      {"type":"text","content":""},
      {"type":"heading2","content":"العلاقات"},
      {"type":"text","content":""}
    ]'::jsonb,
    true
  )
on conflict (id) do nothing;
