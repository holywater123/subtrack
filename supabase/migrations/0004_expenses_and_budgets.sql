-- Run this in the Supabase SQL editor to add one-off expense tracking and
-- per-category monthly budgets.

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'MYR',
  category text not null default 'other',
  spent_on date not null default current_date,
  note text,
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
