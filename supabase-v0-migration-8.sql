-- CookMatch V0 Migration 8: Cook authentication (magic link)
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cooks
  add column if not exists user_id uuid unique references auth.users(id);

-- No RLS policy changes needed: all mutations already flow through the
-- service role key in server-side API routes, which bypasses RLS. The
-- new user_id column is only ever read/written by those same routes.
