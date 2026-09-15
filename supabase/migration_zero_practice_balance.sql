-- ============================================================================
-- Migration: new accounts start at $0.00 practice balance (was $25,000)
--
-- Run this once in the Supabase SQL editor. schema.sql has also been updated
-- so any brand-new project created from it already defaults to 0.
-- ============================================================================

alter table public.profiles
  alter column practice_balance set default 0;

-- Zero out every existing account's balance too (not just future signups).
update public.profiles set practice_balance = 0;
