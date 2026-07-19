-- Sivan Cooks V0 Migration 15: job posting state, for the Community Cravings
-- state filter. Mirrors migration 10 (cooks.state).
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table job_posts
  add column if not exists state text;
