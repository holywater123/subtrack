-- Run this in the Supabase SQL editor to add basic profile fields
-- (used by the new Settings tab and the personalized dashboard greeting).

alter table user_settings add column full_name text;
alter table user_settings add column birthdate date;
alter table user_settings add column goal text;
