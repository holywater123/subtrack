-- Run this in the Supabase SQL editor to add debt tracking, a monthly
-- income field, and cached AI payoff advice.

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
