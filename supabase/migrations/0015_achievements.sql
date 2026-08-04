-- Run this in the Supabase SQL editor to add the achievements/badges system.

create table user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  tier text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id, tier)
);

alter table user_achievements enable row level security;

create policy "Users manage their own user_achievements"
  on user_achievements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index user_achievements_user_id_idx on user_achievements (user_id);
