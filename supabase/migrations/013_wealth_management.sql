-- 013: Wealth Management System — subscriptions, investments, savings goals, categories

alter table public.profiles
  add column if not exists cash_balance double precision not null default 0,
  add column if not exists fi_target_amount double precision default 1000000,
  add column if not exists expected_annual_return_pct double precision default 7;

create table if not exists public.expense_categories (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  color text,
  monthly_budget double precision,
  sort_order int not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  name text not null,
  category text,
  description text,
  price double precision not null check (price >= 0),
  currency text not null default 'SAR',
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'semi_annual', 'annual')),
  renewal_date date,
  payment_method text,
  cancellable boolean not null default true,
  notes text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investments (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  name text not null,
  asset_type text not null check (
    asset_type in (
      'stock', 'etf', 'mutual_fund', 'real_estate', 'gold', 'silver',
      'crypto', 'private', 'deposit', 'sukuk', 'bond', 'other'
    )
  ),
  invested_amount double precision not null default 0,
  purchase_date date,
  cost_basis double precision,
  current_value double precision not null default 0,
  annual_return_pct double precision,
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id text not null default 'domain_finance' references public.life_domains (id),
  name text not null,
  goal_type text not null default 'custom' check (
    goal_type in ('emergency', 'car', 'home', 'wedding', 'investment', 'custom')
  ),
  target_amount double precision not null check (target_amount > 0),
  current_amount double precision not null default 0,
  monthly_contribution double precision not null default 0,
  target_date date,
  priority int not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.net_worth_snapshots (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  snapshot_date date not null,
  cash double precision not null default 0,
  savings double precision not null default 0,
  investments double precision not null default 0,
  debts double precision not null default 0,
  net_worth double precision not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

alter table public.debts
  add column if not exists lender text,
  add column if not exists asset_value double precision,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists interest_rate double precision default 0,
  add column if not exists total_installments int,
  add column if not exists installments_paid int default 0;

alter table public.progress_photos
  add column if not exists photo_angle text check (photo_angle in ('front', 'side', 'back')),
  add column if not exists body_fat_pct double precision;

create index if not exists idx_expense_categories_user on public.expense_categories (user_id, sort_order);
create index if not exists idx_subscriptions_user on public.subscriptions (user_id, active, renewal_date);
create index if not exists idx_investments_user on public.investments (user_id);
create index if not exists idx_savings_goals_user on public.savings_goals (user_id, priority);
create index if not exists idx_net_worth_user on public.net_worth_snapshots (user_id, snapshot_date desc);

alter table public.expense_categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.investments enable row level security;
alter table public.savings_goals enable row level security;
alter table public.net_worth_snapshots enable row level security;

create policy "expense_categories_own" on public.expense_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_own" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investments_own" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "savings_goals_own" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "net_worth_snapshots_own" on public.net_worth_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
