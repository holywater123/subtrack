-- Run this in the Supabase SQL editor to let a debt/credit-card payment be
-- paid FROM a chosen wallet, so the money actually leaving that account is
-- reflected in its balance. The principal portion is tracked here (kept
-- separate from expenses so it isn't double-counted as spend, same
-- reasoning as before) - the interest portion still goes through the
-- existing expenses.debt_id link.

create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_wallet_id uuid not null references wallets(id) on delete cascade,
  target_debt_id uuid references debts(id) on delete cascade,
  target_wallet_id uuid references wallets(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  paid_on date not null default current_date,
  created_at timestamptz not null default now(),
  constraint debt_payments_one_target check (
    (target_debt_id is not null and target_wallet_id is null) or
    (target_debt_id is null and target_wallet_id is not null)
  ),
  constraint debt_payments_source_not_target check (
    source_wallet_id is distinct from target_wallet_id
  )
);

alter table debt_payments enable row level security;

create policy "Users manage their own debt_payments"
  on debt_payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index debt_payments_user_id_idx on debt_payments (user_id);
create index debt_payments_source_wallet_id_idx on debt_payments (source_wallet_id);
create index debt_payments_target_debt_id_idx on debt_payments (target_debt_id);
create index debt_payments_target_wallet_id_idx on debt_payments (target_wallet_id);
