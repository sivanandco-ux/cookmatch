-- CookMatch V0 Migration 7: ID document upload + dish photo gallery
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- ─────────────────────────────────────────────
-- 1. ID DOCUMENT — separate table, NOT publicly readable
-- ─────────────────────────────────────────────
-- Kept out of `cook_verifications` deliberately: that table already has a
-- "publicly readable" policy, and a government ID URL must never be exposed
-- through it. RLS is enabled with zero policies below, which locks all
-- access to the service role only (same pattern as client_cancellations).

create table if not exists cook_id_documents (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid unique not null references cooks(id) on delete cascade,
  document_url text not null,
  uploaded_at timestamptz not null default now()
);

alter table cook_id_documents enable row level security;
-- No policies — service role only, no public read or write

-- ─────────────────────────────────────────────
-- 2. DISH PHOTOS — up to 10 per cook, publicly readable (shown on profile)
-- ─────────────────────────────────────────────

create table if not exists cook_dishes (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  photo_url text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table cook_dishes enable row level security;

create policy "dish photos are publicly readable"
  on cook_dishes for select using (true);

-- No public insert/update/delete policy — uploads go through the service
-- role via the upload API route, same as job_posts status transitions

-- ─────────────────────────────────────────────
-- 3. STORAGE BUCKETS — cannot be created via SQL, do this manually:
-- ─────────────────────────────────────────────
-- Dashboard → Storage → New Bucket → name: "cook-ids"    → Public: OFF
-- Dashboard → Storage → New Bucket → name: "cook-dishes" → Public: ON
