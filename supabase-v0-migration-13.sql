-- CookMatch V0 Migration 13: request type (session vs specific item order)
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table job_posts
  add column if not exists request_type text not null default 'session';

alter table bookings
  add column if not exists request_type text not null default 'session';
