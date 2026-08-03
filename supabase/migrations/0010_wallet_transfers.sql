-- Run this in the Supabase SQL editor to let money be moved between two
-- of the user's own wallets (e.g. sorting cash-pool income into an account).

create table wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id uuid not null references wallets(id) on delete cascade,
  to_wallet_id uuid not null references wallets(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  note text,
  transferred_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table wallet_transfers enable row level security;

create policy "Users manage their own wallet_transfers"
  on wallet_transfers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wallet_transfers_user_id_idx on wallet_transfers (user_id);
create index wallet_transfers_from_wallet_id_idx on wallet_transfers (from_wallet_id);
create index wallet_transfers_to_wallet_id_idx on wallet_transfers (to_wallet_id);
