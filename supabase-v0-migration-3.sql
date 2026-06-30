-- CookMatch V0 Migration 3: Job posts — allow text-only brief + add text_description
-- Run this in Supabase: SQL Editor → New Query → paste → Run
-- Run AFTER supabase-v0-migration.sql and supabase-v0-migration-2.sql

-- Allow voice_memo_url to be null (clients can submit text-only briefs)
alter table job_posts alter column voice_memo_url drop not null;

-- Add written description field
alter table job_posts add column if not exists text_description text;
