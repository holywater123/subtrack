-- Run this in the Supabase SQL editor to add wallets (bank accounts,
-- e-wallets, cash) and an income ledger, and link expenses to a wallet.

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wallet_type text not null default 'cash',
  description text,
  currency text not null default 'MYR',
  starting_balance numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "Users manage their own wallets"
  on wallets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wallets_user_id_idx on wallets (user_id);

create table income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  category text not null default 'other',
  received_on date not null default current_date,
  note text,
  wallet_id uuid references wallets(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table income enable row level security;

create policy "Users manage their own income"
  on income
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index income_user_id_idx on income (user_id);
create index income_received_on_idx on income (received_on);
create index income_wallet_id_idx on income (wallet_id);

alter table expenses add column wallet_id uuid references wallets(id) on delete set null;

create index expenses_wallet_id_idx on expenses (wallet_id);
