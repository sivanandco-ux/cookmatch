-- Make all fields nullable that were removed from the session brief form
alter table job_posts alter column kitchen_access_time drop not null;
alter table job_posts alter column language_preferred drop not null;
alter table job_posts alter column additional_notes drop not null;

alter table bookings alter column kitchen_access_time drop not null;
alter table bookings alter column language_preferred drop not null;
alter table bookings alter column additional_notes drop not null;
