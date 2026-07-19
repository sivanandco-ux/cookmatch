-- CookMatch V0 Migration 14: what a cook offers (home-cooked meals, specific items, or both)
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cooks
  add column if not exists offering_types text[] not null default '{session}';
