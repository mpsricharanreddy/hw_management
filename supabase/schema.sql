-- ============================================================
-- Hardware Management System — Database Schema
-- Run this in Supabase: Project -> SQL Editor -> New Query -> Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILES ----------
-- One row per auth user. Created automatically on signup (see trigger below).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin','user')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created
-- (covers both self-signup and admin-invited users).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- COMPONENTS ----------
-- Each row is one physical hardware unit (trackable individually).
create table if not exists components (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,              -- classification, e.g. Laptop, Monitor, Server, Networking
  serial_number text unique,
  status text not null default 'in_stock' check (status in ('in_stock','assigned','retired')),
  current_owner_id uuid references profiles(id) on delete set null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_components_updated_at on components;
create trigger set_components_updated_at
before update on components
for each row execute function public.set_updated_at();

-- ---------- OWNERSHIP TRANSFERS ----------
-- Full audit trail: which component moved from whom to whom, and who authorized it.
create table if not exists ownership_transfers (
  id uuid primary key default uuid_generate_v4(),
  component_id uuid not null references components(id) on delete cascade,
  from_owner_id uuid references profiles(id),
  to_owner_id uuid references profiles(id),
  transferred_by uuid references profiles(id),
  notes text,
  transferred_at timestamptz not null default now()
);

-- ---------- Helper: check admin without RLS recursion problems ----------
create or replace function public.is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin' and status = 'approved'
  );
$$ language sql security definer stable;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table components enable row level security;
alter table ownership_transfers enable row level security;

-- Profiles: a user can see their own row; admins can see everyone
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

-- Only admins can approve / change roles
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles
  for update using (public.is_admin(auth.uid()));

-- Row is created by the signup trigger, but allow self-insert as a fallback
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles
  for insert with check (auth.uid() = id);

-- Components: any approved user can read; only admins can write
drop policy if exists components_select on components;
create policy components_select on components
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

drop policy if exists components_write on components;
create policy components_write on components
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Ownership transfers: any approved user can read the history; only admins can log a transfer
drop policy if exists transfers_select on ownership_transfers;
create policy transfers_select on ownership_transfers
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

drop policy if exists transfers_insert on ownership_transfers;
create policy transfers_insert on ownership_transfers
  for insert with check (public.is_admin(auth.uid()));

-- ============================================================
-- BOOTSTRAP: after you sign up your first (admin) account through
-- the website, run this once, replacing the email, to promote
-- yourself to admin and approve your own account:
--
--   update profiles set role = 'admin', status = 'approved'
--   where email = 'you@example.com';
-- ============================================================
