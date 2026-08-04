-- Run this in the Supabase SQL editor to add a "daily" billing cycle and
-- an optional end date for subscriptions with a defined term - leave it
-- blank for a continuous, ongoing subscription (the existing default).

alter type billing_cycle add value 'daily';

alter table subscriptions
  add column end_date date;
