-- Run this in the Supabase SQL editor to model credit cards / Pay Later
-- (BNPL) as wallets with real credit-tracking fields, and to add balance
-- transfer plans (moving revolving balance into a fixed-term installment
-- plan) for those wallets.

alter table wallets
  add column statement_balance numeric(10, 2),
  add column outstanding_balance numeric(10, 2),
  add column credit_limit numeric(10, 2),
  add column payment_due_day smallint check (payment_due_day between 1 and 31);

create table balance_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references wallets(id) on delete cascade,
  name text,
  currency text not null default 'MYR',
  original_amount numeric(10, 2) not null,
  total_interest numeric(10, 2) not null default 0,
  term_months integer not null,
  remaining_balance numeric(10, 2) not null,
  installments_paid integer not null default 0,
  created_at timestamptz not null default now()
);

alter table balance_transfers enable row level security;

create policy "Users manage their own balance_transfers"
  on balance_transfers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index balance_transfers_user_id_idx on balance_transfers (user_id);
create index balance_transfers_wallet_id_idx on balance_transfers (wallet_id);

alter table expenses
  add column balance_transfer_id uuid references balance_transfers(id) on delete set null;

create index expenses_balance_transfer_id_idx on expenses (balance_transfer_id);
