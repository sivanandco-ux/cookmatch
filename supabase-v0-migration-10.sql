-- CookMatch V0 Migration 10: cook's state, for nationwide expansion
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cooks
  add column if not exists state text;
