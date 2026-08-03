-- Run this in the Supabase SQL editor to add currency + pause support to an
-- existing subscriptions table (created via schema.sql).

alter table subscriptions
  add column currency text not null default 'USD',
  add column is_paused boolean not null default false;
