-- Manual balance reconciliation ("write-off") - there's realistically never
-- 100% parity between this app's computed balance and a real account (bank
-- fees, a forgotten cash transaction, rounding), so instead of forcing
-- perfect entry discipline, let the user occasionally nudge a wallet's
-- computed balance to match reality. Modeled as a signed delta row (an
-- audit trail with a note and timestamp), not an overwrite of
-- starting_balance - starting_balance means "balance when the wallet was
-- created" and repeatedly overwriting it would corrupt that meaning and
-- lose the adjustment history.
create table wallet_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references wallets(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  note text,
  created_at timestamptz not null default now()
);

alter table wallet_adjustments enable row level security;

create policy "Users manage their own wallet_adjustments"
  on wallet_adjustments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wallet_adjustments_user_id_idx on wallet_adjustments (user_id);
create index wallet_adjustments_wallet_id_idx on wallet_adjustments (wallet_id);
