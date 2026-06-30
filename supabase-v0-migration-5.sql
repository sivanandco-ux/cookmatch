-- Make time fields nullable since they are no longer collected in the form
alter table job_posts alter column requested_time drop not null;
alter table bookings alter column preferred_time drop not null;
