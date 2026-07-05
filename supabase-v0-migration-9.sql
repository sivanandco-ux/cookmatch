-- CookMatch V0 Migration 9: OTP-verified job start
-- Run this in Supabase: SQL Editor → New Query → paste → Run

alter table bookings
  add column if not exists started_at timestamptz,
  add column if not exists start_otp_hash text,
  add column if not exists start_otp_expires_at timestamptz,
  add column if not exists start_otp_attempts int not null default 0;
