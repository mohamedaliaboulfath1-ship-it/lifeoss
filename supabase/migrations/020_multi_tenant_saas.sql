-- Phase 1: Multi-tenant SaaS foundation
-- Additive only — existing user data untouched

-- Extend role to include super_admin (Mohamed Ali production account)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

-- Tenant isolation columns (v1: 1 user = 1 tenant = 1 workspace)
alter table public.profiles
  add column if not exists tenant_id uuid references auth.users (id) on delete cascade,
  add column if not exists workspace_id uuid;

-- Backfill existing profiles — never null for production users
update public.profiles
set
  tenant_id = coalesce(tenant_id, id),
  workspace_id = coalesce(workspace_id, id)
where tenant_id is null or workspace_id is null;

create index if not exists idx_profiles_tenant on public.profiles (tenant_id);
create index if not exists idx_profiles_workspace on public.profiles (workspace_id);

-- Promote master production account (email-based, idempotent)
update public.profiles
set role = 'super_admin'
where id in (
  select id from auth.users
  where email = 'mohamedaliabouelfath1@gmail.com'
);

-- Update new-user trigger to set tenant/workspace
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    tenant_id,
    workspace_id,
    metadata
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.id,
    new.id,
    jsonb_build_object(
      'saas', jsonb_build_object(
        'plan', 'free',
        'onboardingCompleted', false,
        'primaryGoal', null,
        'welcomeChecklist', jsonb_build_object(
          'profile', false,
          'goal', false,
          'habit', false,
          'task', false,
          'book', false,
          'project', false,
          'areaLink', false
        ),
        'toursCompleted', '[]'::jsonb,
        'demoSeeded', false
      )
    )
  );
  return new;
end;
$$;

-- Super-admin helper (non-destructive reads across tenants for ops only)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Extend is_admin to include super_admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;
