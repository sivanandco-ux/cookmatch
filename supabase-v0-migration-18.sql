-- Sivan Cooks V0 Migration 18: rating dimensions adapt to how the cook was
-- engaged (in-person session vs. an item/delivered meal never cooked in the
-- client's home) — adds Packaging as a dimension for the latter, drops the
-- two dimensions that don't apply when the cook never physically worked in
-- the client's space (Cleanliness, Clean Appearance), and tracks trust
-- scores per category so a cook's item-selling reputation and in-home
-- cooking reputation don't blend into one number.
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- rating_category values: 'session' (cooked in the client's home) | 'item'
-- (a specific item, or a session delivered/picked up rather than cooked
-- on-site) — existing rows predate this feature and were all in-person
-- sessions, hence the 'session' default.
alter table cook_ratings
  add column if not exists rating_category text not null default 'session',
  add column if not exists packaging integer check (packaging between 1 and 5);

-- Cleanliness/Clean Appearance only apply to an in-person session — make
-- them nullable so an 'item' rating can omit them.
alter table cook_ratings
  alter column cleanliness drop not null,
  alter column clean_appearance drop not null;

-- overall_avg was a GENERATED column hardcoded to average all 5 original
-- fields — item ratings now leave two of those null, so the average has to
-- be computed per-category in application code instead. DROP EXPRESSION
-- converts it to a normal writable column while preserving existing values
-- (no data loss), rather than dropping and re-adding the column.
alter table cook_ratings alter column overall_avg drop expression if exists;

-- cook_scores: parallel item-category score track, alongside the existing
-- fields (which remain the session-category track).
alter table cook_scores
  add column if not exists item_overall_score numeric not null default 0,
  add column if not exists item_taste_avg numeric not null default 0,
  add column if not exists item_packaging_avg numeric not null default 0,
  add column if not exists item_punctuality_avg numeric not null default 0,
  add column if not exists item_respect_avg numeric not null default 0,
  add column if not exists item_count integer not null default 0;
