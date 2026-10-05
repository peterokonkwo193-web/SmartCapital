-- ============================================================================
-- Migration: profit_payouts table
--
-- Run this once in the Supabase SQL editor on the project you already set
-- up. schema.sql has also been updated to include this for any new project.
--
-- Records every profit/ROI credit an admin gives a user, so the "Profits &
-- ROI" admin tab has real history instead of relying on local browser
-- storage (which doesn't exist for real Supabase-backed accounts).
-- ============================================================================

create table if not exists public.profit_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  payout_type text not null,
  reason text not null default '',
  actor text not null,
  created_at timestamptz not null default now()
);

create index if not exists profit_payouts_user_id_idx on public.profit_payouts (user_id);
create index if not exists profit_payouts_created_at_idx on public.profit_payouts (created_at desc);

alter table public.profit_payouts enable row level security;

create policy "profit_payouts_select_own_or_admin" on public.profit_payouts
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "profit_payouts_admin_insert" on public.profit_payouts
  for insert with check (public.has_role(auth.uid(), 'admin'));

alter publication supabase_realtime add table public.profit_payouts;
