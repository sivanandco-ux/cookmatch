-- Sivan Cooks V0 Migration 17: cook-side messaging access via a private
-- link (no login required), matching how the client side already works.
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table conversations
  add column if not exists cook_token uuid not null default gen_random_uuid();

create unique index if not exists conversations_cook_token_key
  on conversations(cook_token);
