-- ============================================================================
-- Migration: Funding, Deposits, Withdrawals & Admin Payout Governance
--
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xueiswbfxzsdhywkvpow/sql/new
--
-- This script creates:
-- 1. deposit_requests table with RLS policies
-- 2. withdrawal_requests table with RLS policies
-- 3. storage bucket for deposit-proofs
-- 4. RLS fix for activities (allowing admins to credit profits and notify users)
-- ============================================================================

-- 1. deposit_requests table
create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  method text not null check (method in ('bank_transfer', 'card', 'crypto', 'other')),
  proof_image_path text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists deposit_requests_user_id_idx on public.deposit_requests (user_id);
create index if not exists deposit_requests_status_idx on public.deposit_requests (status);
alter table public.deposit_requests enable row level security;

-- Drop existing policies if already defined to prevent duplicates
drop policy if exists "deposit_requests_select_own_or_admin" on public.deposit_requests;
drop policy if exists "deposit_requests_insert_own" on public.deposit_requests;
drop policy if exists "deposit_requests_admin_review" on public.deposit_requests;

create policy "deposit_requests_select_own_or_admin" on public.deposit_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "deposit_requests_insert_own" on public.deposit_requests
  for insert with check (auth.uid() = user_id);

create policy "deposit_requests_admin_review" on public.deposit_requests
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. withdrawal_requests table
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  method text not null check (method in ('crypto', 'bank_wire', 'paypal', 'other')),
  destination_details text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists withdrawal_requests_user_id_idx on public.withdrawal_requests (user_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status);
alter table public.withdrawal_requests enable row level security;

drop policy if exists "withdrawal_requests_select_own_or_admin" on public.withdrawal_requests;
drop policy if exists "withdrawal_requests_insert_own" on public.withdrawal_requests;
drop policy if exists "withdrawal_requests_admin_review" on public.withdrawal_requests;

create policy "withdrawal_requests_select_own_or_admin" on public.withdrawal_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "withdrawal_requests_insert_own" on public.withdrawal_requests
  for insert with check (auth.uid() = user_id);

create policy "withdrawal_requests_admin_review" on public.withdrawal_requests
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3. Fix activities insert policy so admins can credit profits/notifications for users
drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own_or_admin" on public.activities
  for insert with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- 4. Enable Realtime on tables
do $$
begin
  alter publication supabase_realtime add table public.deposit_requests;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.withdrawal_requests;
exception when others then null;
end $$;

-- 5. Storage bucket for deposit proofs
insert into storage.buckets (id, name, public)
values ('deposit-proofs', 'deposit-proofs', false)
on conflict (id) do nothing;

drop policy if exists "deposit_proofs_insert_own" on storage.objects;
create policy "deposit_proofs_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'deposit-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "deposit_proofs_select_own_or_admin" on storage.objects;
create policy "deposit_proofs_select_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'deposit-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin'))
  );
