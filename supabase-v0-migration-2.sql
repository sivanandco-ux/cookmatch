-- CookMatch V0 Migration 2: Missing booking columns
-- Run this in Supabase: SQL Editor → New Query → paste → Run
-- Run AFTER supabase-v0-migration.sql

alter table bookings
  add column if not exists preferred_time time,
  add column if not exists city text,
  add column if not exists language_preferred text,
  add column if not exists text_description text;
