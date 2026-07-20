-- Sivan Cooks V0 Migration 21: cook waitlist
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Cook signups are capped at 20 (see lib/cookCap.ts) while we're still
-- small. Once full, a new applicant who's already signed in with Google
-- (so we know it's a real person, not a bot) can join this waitlist
-- instead of filling out the full application.
create table if not exists cook_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table cook_waitlist add constraint cook_waitlist_email_key unique (email);

-- Same posture as clients/cooks: RLS enabled, zero public policies —
-- service role only, enforced via the authenticated session in API code.
alter table cook_waitlist enable row level security;
