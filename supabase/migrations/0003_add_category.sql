-- Run this in the Supabase SQL editor to add subscription categories to an
-- existing subscriptions table.

alter table subscriptions
  add column category text not null default 'other';
