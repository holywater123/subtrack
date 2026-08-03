-- Run this in the Supabase SQL editor to add cached AI spending insights.

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
