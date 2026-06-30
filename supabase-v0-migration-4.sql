-- CookMatch V0 Migration 4: Reminder tracking + client_email on DashboardBooking
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Track which reminders have been sent for bookings
alter table bookings
  add column if not exists reminder_24hr_sent boolean not null default false,
  add column if not exists reminder_2hr_sent boolean not null default false;

-- Track which reminders have been sent for job posts
alter table job_posts
  add column if not exists reminder_24hr_sent boolean not null default false,
  add column if not exists reminder_2hr_sent boolean not null default false;
