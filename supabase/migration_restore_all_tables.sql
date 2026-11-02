-- ============================================================================
-- SMARTCAPITAL: RESTORE ALL CLIENT TABLES & CUSTOMER SERVICE SCHEMAS
--
-- Run this entire script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- It creates or repairs all tables needed for:
--  1. Client Accounts & Login Details (profiles, user_roles, signup metadata)
--  2. Customer Service & Two-Way Live Chat (support_tickets, support_ticket_replies)
--  3. Deposit & Withdrawal Request Queues (deposit_requests, withdrawal_requests)
--  4. Profit & Balance Management (profit_payouts, audit_logs)
-- ============================================================================

-- 1. PROFILES (Client metadata & login records)
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

-- Ensure all columns exist if table was already created
alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists country text not null default '',
  add column if not exists role text not null default 'user',
  add column if not exists disabled boolean not null default false,
  add column if not exists practice_balance numeric(14, 2) not null default 0;

-- 2. USER ROLES (Authoritative RBAC table)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Helper function: check if a user is an admin
create or replace function public.has_role(check_user_id uuid, check_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = check_role
  ) or exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = check_role
  );
$$;

-- 3. CUSTOMER SERVICE TICKETS & TWO-WAY CHAT
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. DEPOSIT REQUESTS
create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  method text not null,
  proof_image_path text not null default '',
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

-- 5. WITHDRAWAL REQUESTS
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
  reviewed_by uuid references public.profiles (id)
);

-- 6. PROFIT PAYOUTS & AUDIT LOGS
create table if not exists public.profit_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  payout_type text not null default 'Trading ROI Payout',
  reason text not null default '',
  actor text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

-- 7. AUTOMATED PROFILE POPULATION TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, phone, country, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', ''),
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when profiles.full_name = '' then excluded.full_name else profiles.full_name end,
    phone = case when profiles.phone = '' then excluded.phone else profiles.phone end,
    country = case when profiles.country = '' then excluded.country else profiles.country end;

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

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.profit_payouts enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users read their own or admins read all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- Customer Service: users read/write their own tickets; admins read/write all
drop policy if exists "support_tickets_select_own_or_admin" on public.support_tickets;
create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "support_tickets_update_admin" on public.support_tickets;
create policy "support_tickets_update_admin" on public.support_tickets
  for update using (public.has_role(auth.uid(), 'admin') or auth.uid() = user_id);

-- Customer Service Replies: two-way chat
drop policy if exists "support_ticket_replies_select" on public.support_ticket_replies;
create policy "support_ticket_replies_select" on public.support_ticket_replies
  for select using (
    public.has_role(auth.uid(), 'admin')
    or (
      not is_internal
      and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id and t.user_id = auth.uid()
      )
    )
  );

drop policy if exists "support_ticket_replies_insert" on public.support_ticket_replies;
create policy "support_ticket_replies_insert" on public.support_ticket_replies
  for insert with check (
    public.has_role(auth.uid(), 'admin')
    or (
      author_id = auth.uid()
      and not is_internal
      and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id and t.user_id = auth.uid()
      )
    )
  );

-- Deposit Requests
drop policy if exists "deposit_requests_select" on public.deposit_requests;
create policy "deposit_requests_select" on public.deposit_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "deposit_requests_insert" on public.deposit_requests;
create policy "deposit_requests_insert" on public.deposit_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "deposit_requests_update" on public.deposit_requests;
create policy "deposit_requests_update" on public.deposit_requests
  for update using (public.has_role(auth.uid(), 'admin'));

-- Withdrawal Requests
drop policy if exists "withdrawal_requests_select" on public.withdrawal_requests;
create policy "withdrawal_requests_select" on public.withdrawal_requests
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "withdrawal_requests_insert" on public.withdrawal_requests;
create policy "withdrawal_requests_insert" on public.withdrawal_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "withdrawal_requests_update" on public.withdrawal_requests;
create policy "withdrawal_requests_update" on public.withdrawal_requests
  for update using (public.has_role(auth.uid(), 'admin'));

-- Profit Payouts & Audit Logs
drop policy if exists "profit_payouts_select" on public.profit_payouts;
create policy "profit_payouts_select" on public.profit_payouts
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profit_payouts_admin_insert" on public.profit_payouts;
create policy "profit_payouts_admin_insert" on public.profit_payouts
  for insert with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "audit_logs_insert" on public.audit_logs;
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (true);

-- 9. HELPER: Grant admin privileges to any user by email
-- Example usage: select public.grant_admin_by_email('your-email@example.com');
create or replace function public.grant_admin_by_email(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where lower(email) = lower(target_email);
  if target_id is null then
    return 'User with email ' || target_email || ' not found in auth.users.';
  end if;

  update public.profiles set role = 'admin' where id = target_id;
  insert into public.user_roles (user_id, role)
  values (target_id, 'admin')
  on conflict (user_id, role) do nothing;

  return 'Successfully granted admin privileges to ' || target_email;
end;
$$;

