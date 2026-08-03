-- Run this in the Supabase SQL editor to let one wallet be designated as
-- the default "cash pool" account for new, unsorted income/expenses.

alter table wallets add column is_cash_pool boolean not null default false;

-- Enforce at most one cash-pool wallet per user.
create unique index wallets_one_cash_pool_idx on wallets (user_id)
  where is_cash_pool;
