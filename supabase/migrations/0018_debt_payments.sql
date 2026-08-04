-- Run this in the Supabase SQL editor to let a debt payment's interest
-- portion be logged as a real expense, linked back to the debt it came
-- from (same pattern as expenses.subscription_id).

alter table expenses
  add column debt_id uuid references debts(id) on delete set null;

create index expenses_debt_id_idx on expenses (debt_id);
