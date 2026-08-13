-- Authentication stores one state record per Supabase user.
-- The original MVP constraint only allowed the legacy `main` record.

alter table public.maja_state
  drop constraint if exists maja_state_single_record;
