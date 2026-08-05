-- Run this in the Supabase SQL editor to let users leave feedback (a star
-- rating plus an optional comment) directly in the app.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "Users manage their own feedback"
  on feedback
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index feedback_user_id_idx on feedback (user_id);
