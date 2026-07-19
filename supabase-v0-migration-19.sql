-- Sivan Cooks V0 Migration 19: client accounts (Google sign-in)
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Clients never had accounts before — every booking/conversation just
-- carries a client_email/name/phone snapshot at creation time, no row here
-- to reference. This table is created fresh on first Google login (no
-- backfill migration needed): the client dashboard matches existing
-- bookings/conversations by email at query time rather than requiring a
-- foreign key on every historical row, since client_email is already the
-- de facto identity those tables use.
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

-- Plain uniqueness on the column itself (not a lower() expression index) —
-- upsert's onConflict needs an exact constraint match, and Google always
-- returns email in a consistent canonical form, so a functional
-- case-insensitive index isn't needed here the way ilike is used for cooks.
alter table clients add constraint clients_email_key unique (email);

-- Same posture as cooks/cook_id_documents: RLS enabled, zero public
-- policies — service role only, enforced in API/page code via the
-- authenticated session, not row-level policy.
alter table clients enable row level security;
