-- CookMatch V0 Migration 11: cooking arrangement (client's location / own setup / other)
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cooks
  add column if not exists cooking_arrangement text[] not null default '{}';
