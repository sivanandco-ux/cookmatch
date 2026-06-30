-- CookMatch V0 Migration: Session Brief + Job Board
-- Phase 1: Database Foundation
-- Run this in Supabase: SQL Editor → New Query → paste → Run
-- IMPORTANT: Run after supabase-schema.sql is already applied

-- ─────────────────────────────────────────────
-- 1. COOK PROFILE ADDITIONS
-- ─────────────────────────────────────────────

alter table cooks
  add column if not exists job_categories text[] not null default '{}',
  add column if not exists does_cleanup boolean not null default false,
  add column if not exists grocery_pickup boolean not null default false,
  add column if not exists grocery_pickup_charge numeric;

-- job_categories values: 'family_cooking', 'small_event', 'medium_event'
-- group_size_max already exists — platform enforces max 14 in app logic
-- cuisine_types already exists — covers regional cuisine
-- languages already exists

-- ─────────────────────────────────────────────
-- 2. BOOKINGS TABLE — ADD SESSION BRIEF FIELDS + STATUS
-- ─────────────────────────────────────────────
-- Existing rows get status = 'legacy' so they are unaffected by new flow logic

alter table bookings
  add column if not exists job_category text,
  add column if not exists specific_dishes text,
  add column if not exists num_dishes integer,
  add column if not exists expected_duration_hours numeric,
  add column if not exists num_people integer,
  add column if not exists grocery_situation text,
  add column if not exists cleanup_needed boolean default false,
  add column if not exists kitchen_access_time time,
  add column if not exists parking_available boolean default false,
  add column if not exists voice_memo_url text,
  add column if not exists status text not null default 'legacy',
  add column if not exists cook_interested_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text;

-- status values: 'legacy' | 'pending' | 'cook_interested' | 'confirmed' | 'cancelled' | 'completed'
-- cancelled_by values: 'client' | 'cook'

-- ─────────────────────────────────────────────
-- 3. JOB POSTS TABLE (new job board flow)
-- ─────────────────────────────────────────────

create table if not exists job_posts (
  id uuid primary key default gen_random_uuid(),

  -- Client info
  client_name text not null,
  client_email text not null,
  client_phone text not null,

  -- Session brief
  job_category text not null,
  occasion text not null,
  specific_dishes text,
  num_dishes integer not null,
  requested_date date not null,
  requested_time time not null,
  expected_duration_hours numeric not null check (expected_duration_hours >= 2),
  num_people integer not null check (num_people between 2 and 14),
  dietary_restrictions text[] not null default '{}',
  grocery_situation text not null,
  cleanup_needed boolean not null default false,
  kitchen_access_time time not null,
  city text not null,
  parking_available boolean not null default false,
  language_preferred text,
  recurring boolean not null default false,
  voice_memo_url text not null,
  additional_notes text,

  -- Lifecycle
  status text not null default 'open',
  assigned_cook_id uuid references cooks(id),
  confirmed_at timestamptz,
  completed_at timestamptz,
  expired_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- status values: 'open' | 'taken' | 'done' | 'expired'
-- job_category values: 'family_cooking' | 'small_event' | 'medium_event'
-- grocery_situation values: 'client_has_everything' | 'need_grocery_pickup' | 'cook_brings_ingredients'
-- city values: 'Fremont' | 'Newark' | 'Union City' | 'Milpitas'

-- ─────────────────────────────────────────────
-- 4. JOB INTERESTS TABLE
-- ─────────────────────────────────────────────

create table if not exists job_interests (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references job_posts(id) on delete cascade,
  cook_id uuid not null references cooks(id) on delete cascade,
  expressed_at timestamptz not null default now(),
  status text not null default 'pending',
  unique(job_post_id, cook_id)
);

-- status values: 'pending' | 'accepted' | 'rejected'

-- ─────────────────────────────────────────────
-- 5. CLIENT CANCELLATIONS TABLE
-- ─────────────────────────────────────────────

create table if not exists client_cancellations (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  booking_id uuid references bookings(id),
  job_post_id uuid references job_posts(id),
  session_date date not null,
  hours_before_session numeric not null,
  within_48hrs boolean generated always as (hours_before_session < 48) stored,
  cancelled_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table job_posts enable row level security;
alter table job_interests enable row level security;
alter table client_cancellations enable row level security;

-- Job posts: anyone can read (API filters what fields to expose per audience)
create policy "job posts are publicly readable"
  on job_posts for select using (true);

-- Job posts: anyone can insert (clients post without auth)
create policy "anyone can post a job"
  on job_posts for insert with check (true);

-- Job posts: service role handles status updates (taken, done, expired)
-- No public update policy — status transitions happen server-side only

-- Job interests: anyone can read
create policy "job interests are publicly readable"
  on job_interests for select using (true);

-- Job interests: anyone can insert (cook expresses interest — identified by cook_id)
create policy "anyone can express interest in a job"
  on job_interests for insert with check (true);

-- Client cancellations: service role only — no public read or write
-- Cancellation logging happens server-side only

-- ─────────────────────────────────────────────
-- 7. SUPABASE STORAGE BUCKET
-- ─────────────────────────────────────────────
-- Cannot be created via SQL. Do this manually in Supabase dashboard:
-- Storage → New Bucket → name: "voice-memos" → Public: OFF
-- Then add policy: authenticated users can upload, service role can read
-- For v0 (no auth): allow insert from anon, restrict read to service role
-- Dashboard path: Storage → voice-memos → Policies → Add policy
