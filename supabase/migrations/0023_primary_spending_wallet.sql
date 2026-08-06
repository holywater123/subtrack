-- A second, independent default-wallet flag from is_cash_pool: is_cash_pool
-- marks where cash "lives" (used for the Cash pool summary + total-cash-on-hand
-- rollup), while is_primary_spending marks which wallet new EXPENSE entries
-- should default to - deliberately separate so e.g. a credit card can be the
-- primary spending method without being counted as cash on hand.
alter table wallets add column is_primary_spending boolean not null default false;

-- Enforce at most one primary-spending wallet per user, same pattern as
-- wallets_one_cash_pool_idx.
create unique index wallets_one_primary_spending_idx on wallets (user_id)
  where is_primary_spending;
