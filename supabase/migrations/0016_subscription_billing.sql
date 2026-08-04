-- Run this in the Supabase SQL editor to add real billing dates and
-- date-scoped pausing to subscriptions, and link auto-generated expense
-- rows back to the subscription that created them.

alter table subscriptions
  add column next_billing_date date not null default current_date,
  -- Fixed anchor day-of-month, set once from next_billing_date and never
  -- mutated afterward - advancing next_billing_date clamps to this day
  -- (or the target month's last day, if shorter) so a subscription billed
  -- on e.g. the 31st snaps back to the 31st in every 31-day month instead
  -- of permanently drifting to an earlier day after passing through Feb.
  add column billing_day smallint not null default 1 check (billing_day between 1 and 31),
  add column paused_until date,
  add column paused_permanent boolean not null default false;

alter table expenses
  add column subscription_id uuid references subscriptions(id) on delete set null;

create index expenses_subscription_id_idx on expenses (subscription_id);
