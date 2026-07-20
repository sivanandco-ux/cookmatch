-- Sivan Cooks V0 Migration 22: waitlist city + cooking interest
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cook_waitlist add column if not exists city text;
alter table cook_waitlist add column if not exists cooking_interest text;
