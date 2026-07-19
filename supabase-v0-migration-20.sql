-- Sivan Cooks V0 Migration 20: cook WhatsApp group invite link
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Separate from cooks.whatsapp (the cook's personal WhatsApp number, used
-- for 1:1 contact) — this is an optional public group invite link a cook
-- can share so interested clients can join a community group.
alter table cooks
  add column if not exists whatsapp_group_link text;
