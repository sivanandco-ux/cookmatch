-- Sivan Cooks V0 Migration 24: close public write access to the database
-- Run this in Supabase: SQL Editor → New Query → paste → Run
--
-- Based on the actual live policy list (pulled via pg_policies), not just
-- the migration files on disk — two of the policies fixed here
-- (cook_verifications insert, cook_scores insert) were created directly in
-- the Supabase dashboard at some point and were never in any tracked
-- migration file, so this comment block exists to explain what's really
-- going on for future reference.

-- ── Fully unconditional INSERT policies, confirmed unused ──────────────
-- These predate the app's dedicated API routes. Verified each one's real
-- insert path uses the service-role key server-side (which bypasses RLS
-- entirely and does its own validation), so the anon-key policy allowing
-- "anyone, no checks" is pure unused exposure — safe to drop outright.
drop policy "anyone can submit a booking" on bookings;
drop policy "anyone can submit a cook rating" on cook_ratings;
drop policy "anyone can submit a client rating" on client_ratings;
drop policy "anyone can post a job" on job_posts;
drop policy "anyone can express interest in a job" on job_interests;

-- ── INSERT policies that ARE genuinely needed, but were unconditional ──
-- /api/apply inserts into these three tables using the anon key under the
-- signed-in user's own session (not the service-role key), so dropping
-- these outright would break real cook signups. Replacing "anyone" with
-- "only for a row that's actually yours" instead of removing them.
drop policy "anyone can apply as a cook" on cooks;
create policy "a signed-in user can create their own cook profile"
  on cooks for insert with check (auth.uid() = user_id);

drop policy "cook_verifications insert" on cook_verifications;
create policy "a cook can create their own verification record"
  on cook_verifications for insert with check (
    exists (select 1 from cooks where cooks.id = cook_verifications.cook_id and cooks.user_id = auth.uid())
  );

drop policy "cook_scores insert" on cook_scores;
create policy "a cook can create their own score record"
  on cook_scores for insert with check (
    exists (select 1 from cooks where cooks.id = cook_scores.cook_id and cooks.user_id = auth.uid())
  );

-- ── job_posts was also fully publicly readable with no column limit ────
-- Exposed every client's name/email/phone on every job post to anyone
-- querying the API directly. Every page that lists/shows job posts reads
-- via the service-role key already — the one exception is /my-bookings,
-- which needs a signed-in client to see their own posts. Scoping to the
-- signed-in user's own email (matching the app's own case-insensitive
-- match) keeps that working while closing the leak.
drop policy "job posts are publicly readable" on job_posts;
create policy "clients can read their own job posts"
  on job_posts for select using (lower(client_email) = lower(auth.jwt() ->> 'email'));

-- ── bookings had no read policy at all ──────────────────────────────────
-- Meaning /my-bookings' "Direct Bookings" section has been silently
-- returning empty for everyone (RLS denies by default with no policy
-- present) — a functional bug, not a security issue, fixed the same way.
create policy "clients can read their own bookings"
  on bookings for select using (lower(client_email) = lower(auth.jwt() ->> 'email'));

-- ── Other unused public read policies ───────────────────────────────────
-- Every reader of these two goes through the service-role key already.
drop policy "job interests are publicly readable" on job_interests;
drop policy "ratings are publicly readable" on cook_ratings;
