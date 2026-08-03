-- Run this in the Supabase SQL editor. The manual "monthly income" field
-- is superseded by the Income tab's real ledger (used directly by the
-- debt advice prompt now), so the column is no longer read anywhere.

alter table user_settings drop column monthly_income;
