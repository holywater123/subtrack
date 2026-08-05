-- Run this in the Supabase SQL editor to support mandatory onboarding and
-- the extra profile fields it collects.

alter table user_settings add column onboarding_completed_at timestamptz;
alter table user_settings add column occupation text;
alter table user_settings add column lifestyle text;
alter table user_settings add column country text;
alter table user_settings add column default_currency text not null default 'MYR';
alter table user_settings add column tracking_focus text;
