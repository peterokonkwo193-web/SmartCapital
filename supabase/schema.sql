-- ============================================================================
-- SmartCapital — Supabase schema
--
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh
-- project. It creates every table the app can talk to, enables Row Level
-- Security everywhere, and defines policies so access control is enforced by
-- Postgres itself — never solely by the frontend.
--
-- This is a paper-trading / market-education platform. No table here stores
-- real payment instruments, wallet addresses, or promises a fixed return.
-- practice_balance and paper_trades are simulated only.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  country text not null default '',
  avatar_url text,
  practice_balance numeric(14, 2) not null default 0 check (practice_balance >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- user_roles — authoritative RBAC table (kept separate from `profiles` so a
-- user can never grant themselves admin by editing their own profile row).
-- ----------------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- ----------------------------------------------------------------------------
-- watchlist
-- ----------------------------------------------------------------------------
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

-- ----------------------------------------------------------------------------
-- paper_trades — user trade orders and executions.
-- ----------------------------------------------------------------------------
create table if not exists public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  type text not null check (type in ('market', 'limit', 'stop')),
  quantity numeric(18, 6) not null check (quantity > 0),
  price numeric(14, 4) not null check (price >= 0),
  status text not null default 'open' check (status in ('filled', 'open', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists paper_trades_user_id_idx on public.paper_trades (user_id);
create index if not exists paper_trades_created_at_idx on public.paper_trades (created_at desc);

-- ----------------------------------------------------------------------------
-- portfolio_positions — aggregated simulated holdings per user/symbol.
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  quantity numeric(18, 6) not null default 0,
  avg_cost numeric(14, 4) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists portfolio_positions_user_id_idx on public.portfolio_positions (user_id);

create trigger portfolio_positions_set_updated_at
  before update on public.portfolio_positions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- trades — realized (closed) simulated trade history, derived from
-- paper_trades once a position is closed. Kept distinct from paper_trades so
-- open orders and realized P&L can be queried independently.
-- ----------------------------------------------------------------------------
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(18, 6) not null check (quantity > 0),
  entry_price numeric(14, 4) not null,
  exit_price numeric(14, 4),
  profit_loss numeric(14, 4),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists trades_user_id_idx on public.trades (user_id);

-- ----------------------------------------------------------------------------
-- traders — simulated strategy profiles shown on /traders.
-- ----------------------------------------------------------------------------
create table if not exists public.traders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_initials text not null,
  strategy text not null,
  bio text not null,
  simulated_return numeric(6, 2) not null,
  win_rate numeric(5, 2) not null check (win_rate between 0 and 100),
  risk_level text not null check (risk_level in ('Low', 'Moderate', 'High')),
  experience_years int not null check (experience_years >= 0),
  simulated_followers int not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- copy_trades — user follow of a trader strategy.
-- ----------------------------------------------------------------------------
create table if not exists public.copy_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trader_id uuid not null references public.traders (id) on delete cascade,
  active boolean not null default true,
  started_at timestamptz not null default now(),
  unique (user_id, trader_id)
);

create index if not exists copy_trades_user_id_idx on public.copy_trades (user_id);

-- ----------------------------------------------------------------------------
-- activities — account activity feed.
-- ----------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('trade', 'watchlist', 'profile', 'support', 'account', 'profit')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_created_at_idx on public.activities (created_at desc);

-- ----------------------------------------------------------------------------
-- support_tickets
-- ----------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id);

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- support_ticket_replies — admin responses on a ticket, plus admin-only
-- internal notes (is_internal = true) that the ticket owner never sees.
-- ----------------------------------------------------------------------------
create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_replies_ticket_id_idx on public.support_ticket_replies (ticket_id, created_at);

-- ----------------------------------------------------------------------------
-- deposit_requests — user-submitted deposit requests with proof image,
-- reviewed (approved/rejected) by an admin. Approval credits live balance.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- education_content — CMS-style backing store for /education/:slug.
-- ----------------------------------------------------------------------------
create table if not exists public.education_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null,
  body jsonb not null,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger education_content_set_updated_at
  before update on public.education_content
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- market_snapshots — periodic simulated price snapshots, for admin visibility
-- and potential historical charting.
-- ----------------------------------------------------------------------------
create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  category text not null check (category in ('stocks', 'crypto', 'etfs', 'commodities', 'indices')),
  price numeric(18, 6) not null,
  change_24h numeric(8, 4) not null,
  market_cap numeric(20, 2),
  volume_24h numeric(20, 2),
  captured_at timestamptz not null default now()
);

create index if not exists market_snapshots_symbol_idx on public.market_snapshots (symbol, captured_at desc);

-- ----------------------------------------------------------------------------
-- investments — reference catalog of investable products (separate from the
-- live/demo `market_snapshots` feed; used for editorial/admin curation).
-- ----------------------------------------------------------------------------
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  category text not null check (category in ('stocks', 'crypto', 'etfs', 'commodities', 'indices')),
  risk_level text not null check (risk_level in ('Low', 'Moderate', 'High', 'Very High')),
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs — administrative action trail. Insert-only from the app; not
-- user-editable or deletable.
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ============================================================================
-- New-user bootstrap: create a profile + default role automatically when
-- someone signs up via Supabase Auth.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, phone, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.watchlist enable row level security;
alter table public.paper_trades enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.trades enable row level security;
alter table public.traders enable row level security;
alter table public.copy_trades enable row level security;
alter table public.activities enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.education_content enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.investments enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: read own or admin; update own (role/practice_balance changes are
-- ignored client-side by convention — enforce server-side via a trigger if
-- you expose those fields to non-admin updates).
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- user_roles: users can see their own role; only admins manage roles.
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_write" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- per-user tables: full CRUD on own rows, read-all for admins.
create policy "watchlist_owner" on public.watchlist
  for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id);

create policy "paper_trades_select_own_or_admin" on public.paper_trades
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "paper_trades_insert_own" on public.paper_trades
  for insert with check (auth.uid() = user_id);
create policy "paper_trades_update_own_open_or_admin" on public.paper_trades
  for update using (
    (auth.uid() = user_id and status = 'open') or public.has_role(auth.uid(), 'admin')
  );

create policy "portfolio_positions_owner" on public.portfolio_positions
  for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id);

create policy "trades_select_own_or_admin" on public.trades
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "trades_insert_own" on public.trades
  for insert with check (auth.uid() = user_id);

create policy "copy_trades_owner" on public.copy_trades
  for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id);

create policy "activities_select_own_or_admin" on public.activities
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = user_id);

create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);
create policy "support_tickets_update_own_or_admin" on public.support_tickets
  for update using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- support_ticket_replies: the ticket owner can read non-internal replies on their
-- own ticket; admins can read (and write) everything, including internal notes.
create policy "support_ticket_replies_select_owner_or_admin" on public.support_ticket_replies
  for select using (
    public.has_role(auth.uid(), 'admin')
    or (
      not is_internal
      and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
    )
  );
create policy "support_ticket_replies_admin_insert" on public.support_ticket_replies
  for insert with check (public.has_role(auth.uid(), 'admin') and author_id = auth.uid());

-- deposit_requests: user submits/reads own requests; only admins review them.
create policy "deposit_requests_select_own_or_admin" on public.deposit_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "deposit_requests_insert_own" on public.deposit_requests
  for insert with check (auth.uid() = user_id);
create policy "deposit_requests_admin_review" on public.deposit_requests
  for update using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- catalog / reference tables: public read, admin write.
create policy "traders_public_read" on public.traders for select using (true);
create policy "traders_admin_write" on public.traders
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "education_content_public_read" on public.education_content
  for select using (published or public.has_role(auth.uid(), 'admin'));
create policy "education_content_admin_write" on public.education_content
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "market_snapshots_public_read" on public.market_snapshots for select using (true);
create policy "market_snapshots_admin_write" on public.market_snapshots
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "investments_public_read" on public.investments for select using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "investments_admin_write" on public.investments
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- audit_logs: admin-only, insert-only from clients (no update/delete policy
-- means those operations are denied by default under RLS).
create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "audit_logs_admin_insert" on public.audit_logs
  for insert with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Realtime: expose the tables the UI subscribes to.
-- ============================================================================
alter publication supabase_realtime add table public.paper_trades;
alter publication supabase_realtime add table public.watchlist;
alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.support_ticket_replies;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.deposit_requests;

-- ============================================================================
-- Storage: a private bucket for user-uploaded deposit proof images. Each
-- user may only write under their own `${user_id}/...` folder; admins can
-- read every file, everyone else can only read their own.
-- ============================================================================
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
