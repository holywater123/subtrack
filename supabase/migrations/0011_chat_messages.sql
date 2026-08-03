-- Run this in the Supabase SQL editor to add the AI finance advisor chat.

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
