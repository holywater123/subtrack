-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create type billing_cycle as enum ('monthly', 'yearly', 'weekly');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  currency text not null default 'USD',
  billing_cycle billing_cycle not null default 'monthly',
  category text not null default 'other',
  is_paused boolean not null default false,
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Users manage their own subscriptions"
  on subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index subscriptions_user_id_idx on subscriptions (user_id);

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wallet_type text not null default 'cash',
  description text,
  currency text not null default 'MYR',
  starting_balance numeric(10, 2) not null default 0,
  is_cash_pool boolean not null default false,
  created_at timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "Users manage their own wallets"
  on wallets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wallets_user_id_idx on wallets (user_id);

-- Enforce at most one cash-pool wallet per user.
create unique index wallets_one_cash_pool_idx on wallets (user_id)
  where is_cash_pool;

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

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  category text not null default 'other',
  spent_on date not null default current_date,
  note text,
  receipt_path text,
  receipt_uploaded_at timestamptz,
  wallet_id uuid references wallets(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "Users manage their own expenses"
  on expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index expenses_user_id_idx on expenses (user_id);
create index expenses_spent_on_idx on expenses (spent_on);
create index expenses_wallet_id_idx on expenses (wallet_id);

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

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table budgets enable row level security;

create policy "Users manage their own budgets"
  on budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table ai_insights (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null,
  generated_at timestamptz not null default now()
);

alter table ai_insights enable row level security;

create policy "Users manage their own ai_insights"
  on ai_insights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  debt_type text not null default 'credit_card',
  balance numeric(10, 2) not null,
  currency text not null default 'MYR',
  interest_rate numeric(5, 2),
  due_date date,
  created_at timestamptz not null default now()
);

alter table debts enable row level security;

create policy "Users manage their own debts"
  on debts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index debts_user_id_idx on debts (user_id);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_income numeric(10, 2),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users manage their own user_settings"
  on user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table debt_advice (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null,
  generated_at timestamptz not null default now()
);

alter table debt_advice enable row level security;

create policy "Users manage their own debt_advice"
  on debt_advice
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "Users manage their own chat_messages"
  on chat_messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index chat_messages_user_id_idx on chat_messages (user_id);
create index chat_messages_created_at_idx on chat_messages (created_at);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Users manage their own receipt files"
  on storage.objects
  for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
