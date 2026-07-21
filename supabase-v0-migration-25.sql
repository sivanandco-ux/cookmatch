-- Sivan Cooks V0 Migration 25: record Terms of Service acceptance
-- Run this in Supabase: SQL Editor → New Query → paste → Run
--
-- The Terms of Service page (app/terms/page.tsx) carries real legal weight
-- (liability cap, assumption-of-risk, indemnification, class-action waiver)
-- but until now acceptance was only enforced by a client-side "required"
-- checkbox on /apply, wasn't collected at all in the ChatWidget signup
-- flows, and was never persisted anywhere — no record existed of who
-- agreed to what, when. This adds a timestamp column set server-side at
-- the moment of insert, so acceptance is provable later if it's ever
-- contested. NULL means no acceptance was recorded for that row (e.g. a
-- cook or client who came through the voice-assistant chat mode, which
-- doesn't yet have an equivalent spoken-consent step).

alter table cooks add column terms_accepted_at timestamptz;
alter table job_posts add column terms_accepted_at timestamptz;
