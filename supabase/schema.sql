-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create type billing_cycle as enum ('monthly', 'yearly', 'weekly');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  currency text not null default 'USD',
  billing_cycle billing_cycle not null default 'monthly',
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
