-- ============================================================================
-- Migration: two-way support chat
--
-- Run this once in the Supabase SQL editor on the project you already set
-- up. schema.sql has also been updated to include this for any new project.
--
-- Previously only admins could insert rows into support_ticket_replies, so
-- a user could open a ticket but never reply to it. This adds a policy
-- letting the ticket owner post their own (non-internal) replies.
-- ============================================================================

create policy "support_ticket_replies_owner_insert" on public.support_ticket_replies
  for insert with check (
    author_id = auth.uid()
    and is_internal = false
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );
