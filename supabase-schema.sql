-- CookMatch Database Schema
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- Cooks table
create table cooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text not null,
  whatsapp text,
  bio text not null,
  tagline text not null,
  video_url text,
  photo_url text,
  cuisine_types text[] not null default '{}',
  dietary_specialties text[] not null default '{}',
  occasion_types text[] not null default '{}',
  languages text[] not null default '{}',
  price_min numeric not null,
  price_max numeric not null,
  price_unit text not null default 'per_session',
  service_areas text[] not null default '{}',
  group_size_min integer not null default 2,
  group_size_max integer not null default 10,
  signature_dishes text not null default '',
  years_experience integer not null default 0,
  available_recurring boolean not null default false,
  recurring_options text[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cook verifications table
create table cook_verifications (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  id_verified boolean not null default false,
  id_verified_at timestamptz,
  background_check_passed boolean not null default false,
  background_check_at timestamptz,
  food_handler_certified boolean not null default false,
  food_handler_expiry date,
  references_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cook scores table (managed by Agent 5 in Phase 2)
create table cook_scores (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid unique not null references cooks(id) on delete cascade,
  overall_score numeric not null default 0,
  cleanliness_avg numeric not null default 0,
  punctuality_avg numeric not null default 0,
  taste_avg numeric not null default 0,
  respect_avg numeric not null default 0,
  clean_appearance_avg numeric not null default 0,
  session_count integer not null default 0,
  response_rate numeric not null default 0,
  verification_score numeric not null default 0,
  training_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  session_type text not null default 'one_time',
  recurring_frequency text,
  preferred_date date not null,
  group_size text not null,
  cuisine_needs text not null default '',
  dietary_needs text not null default '',
  occasion_type text not null,
  notes text not null default '',
  discount_code_sent boolean not null default false,
  cook_notified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cook ratings (client rates cook after session)
create table cook_ratings (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  cleanliness integer not null check (cleanliness between 1 and 5),
  punctuality integer not null check (punctuality between 1 and 5),
  taste integer not null check (taste between 1 and 5),
  respect integer not null check (respect between 1 and 5),
  clean_appearance integer not null check (clean_appearance between 1 and 5),
  overall_avg numeric generated always as (
    (cleanliness + punctuality + taste + respect + clean_appearance)::numeric / 5
  ) stored,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Client ratings (cook rates client after session)
create table client_ratings (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  respect_courtesy integer not null check (respect_courtesy between 1 and 5),
  clear_instructions integer not null check (clear_instructions between 1 and 5),
  timely_payment integer not null check (timely_payment between 1 and 5),
  supplies_available integer not null check (supplies_available between 1 and 5),
  would_cook_again integer not null check (would_cook_again between 1 and 5),
  overall_avg numeric generated always as (
    (respect_courtesy + clear_instructions + timely_payment + supplies_available + would_cook_again)::numeric / 5
  ) stored,
  created_at timestamptz not null default now()
);

-- Training modules table
create table training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  video_url text not null,
  dimension text not null,
  created_at timestamptz not null default now()
);

-- Cook training assignments
create table cook_training (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references cooks(id) on delete cascade,
  module_id uuid not null references training_modules(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'assigned'
);

-- Enable Row Level Security
alter table cooks enable row level security;
alter table cook_verifications enable row level security;
alter table cook_scores enable row level security;
alter table bookings enable row level security;
alter table cook_ratings enable row level security;
alter table client_ratings enable row level security;
alter table training_modules enable row level security;
alter table cook_training enable row level security;

-- Public read access for cooks (active ones only shown via app logic)
create policy "cooks are publicly readable"
  on cooks for select using (true);

-- Public read for verifications and scores
create policy "verifications are publicly readable"
  on cook_verifications for select using (true);

create policy "scores are publicly readable"
  on cook_scores for select using (true);

create policy "ratings are publicly readable"
  on cook_ratings for select using (true);

create policy "training modules are publicly readable"
  on training_modules for select using (true);

-- Anyone can insert a cook application
create policy "anyone can apply as a cook"
  on cooks for insert with check (true);

-- Anyone can create a booking inquiry
create policy "anyone can submit a booking"
  on bookings for insert with check (true);

-- Anyone can submit a cook rating
create policy "anyone can submit a cook rating"
  on cook_ratings for insert with check (true);

-- Anyone can submit a client rating
create policy "anyone can submit a client rating"
  on client_ratings for insert with check (true);
