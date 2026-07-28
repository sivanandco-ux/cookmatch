-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Client's chosen fulfillment for a home-cooked meal session (pickup, cook
-- visits their home, or delivery). Only applies to request_type = 'session'
-- — 'item' orders don't have this concept. Nullable since existing rows
-- predate this field and item orders never set it.
alter table job_posts
  add column if not exists fulfillment_method text;

alter table bookings
  add column if not exists fulfillment_method text;
