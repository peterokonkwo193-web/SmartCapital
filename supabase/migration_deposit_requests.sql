-- ============================================================================
-- Migration: deposit_requests table + proof-image storage bucket
--
-- Run this once in the Supabase SQL editor on the project you already set
-- up. schema.sql has also been updated to include this for any new project.
--
-- Approving a deposit request credits the user's live trading balance.
-- ============================================================================

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

create policy "deposit_requests_select_own_or_admin" on public.deposit_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "deposit_requests_insert_own" on public.deposit_requests
  for insert with check (auth.uid() = user_id);
create policy "deposit_requests_admin_review" on public.deposit_requests
  for update using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

alter publication supabase_realtime add table public.deposit_requests;

insert into storage.buckets (id, name, public)
values ('deposit-proofs', 'deposit-proofs', false)
on conflict (id) do nothing;

create policy "deposit_proofs_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'deposit-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "deposit_proofs_select_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'deposit-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin'))
  );
