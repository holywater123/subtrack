-- Run this in the Supabase SQL editor to let users reorder and show/hide
-- the section blocks on the Overview page.

alter table user_settings add column overview_layout jsonb;
