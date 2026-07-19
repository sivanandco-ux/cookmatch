-- Sivan Cooks V0 Migration 16: 1:1 client-cook messaging
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- A conversation only ever exists once a real client-cook pairing already
-- exists. intent_type tells you which pairing it is, and exactly one of
-- booking_id / job_interest_id is set to match (enforced in the API routes
-- that create these rows, not via a DB constraint — same posture as every
-- other status/intent field in this schema):
--   intent_type = 'booking'      -> booking_id set, job_interest_id null
--   intent_type = 'job_interest' -> job_interest_id set, booking_id null
--
-- No clients table exists in this schema — client contact fields are
-- copied onto this row at creation time, same pattern as bookings/job_posts.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  intent_type text not null,
  booking_id uuid references bookings(id) on delete cascade,
  job_interest_id uuid references job_interests(id) on delete cascade,
  cook_id uuid not null references cooks(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  reported boolean not null default false,
  reported_at timestamptz,
  reported_by text,
  client_last_notified_at timestamptz,
  cook_last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- intent_type values: 'booking' | 'job_interest'
-- reported_by values: 'client' | 'cook'

create unique index if not exists conversations_booking_id_key
  on conversations(booking_id) where booking_id is not null;
create unique index if not exists conversations_job_interest_id_key
  on conversations(job_interest_id) where job_interest_id is not null;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- sender_type values: 'client' | 'cook'

create index if not exists messages_conversation_id_created_at_idx
  on messages(conversation_id, created_at);

-- Same posture as client_cancellations / cook_id_documents: RLS enabled,
-- zero public policies. The client's only credential is the unguessable
-- conversation.id in the URL; the cook's is their authenticated dashboard
-- session. Both are enforced in API routes via the service role key.
alter table conversations enable row level security;
alter table messages enable row level security;
