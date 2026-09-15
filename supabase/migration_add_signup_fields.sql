-- ============================================================================
-- Migration: add first_name / last_name / phone / country to profiles
--
-- Run this once in the Supabase SQL editor on a project that was already set
-- up from an earlier version of schema.sql (which used `create table if not
-- exists`, so it won't add these columns to an existing table on its own).
-- schema.sql has also been updated to include these columns for any new
-- project.
-- ============================================================================

alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists country text not null default '';

-- Re-create the new-user trigger function so future sign-ups populate the
-- new columns from the sign-up form's metadata.
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
