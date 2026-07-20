-- Sivan Cooks V0 Migration 23: waitlist state
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cook_waitlist add column if not exists state text;
