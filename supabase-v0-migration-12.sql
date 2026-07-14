-- CookMatch V0 Migration 12: social links for cook profiles
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table cooks
  add column if not exists instagram_url text,
  add column if not exists youtube_url text;
