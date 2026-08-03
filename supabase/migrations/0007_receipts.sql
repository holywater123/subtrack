-- Run this in the Supabase SQL editor to add receipt upload support for
-- expenses (a private Storage bucket + two new columns on `expenses`).

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Users manage their own receipt files"
  on storage.objects
  for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

alter table expenses
  add column receipt_path text,
  add column receipt_uploaded_at timestamptz;
