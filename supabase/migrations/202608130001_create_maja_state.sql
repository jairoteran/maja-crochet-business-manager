-- Almacenamiento provisional para el MVP de una sola usuaria.
-- Ejecutar en Supabase > SQL Editor. Reemplazar estas políticas al añadir Auth.

create table if not exists public.maja_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint maja_state_single_record check (id = 'main')
);

alter table public.maja_state enable row level security;

grant select, insert, update on table public.maja_state to anon, authenticated;

drop policy if exists "Temporary MVP read access" on public.maja_state;
create policy "Temporary MVP read access"
  on public.maja_state for select
  to anon, authenticated
  using (id = 'main');

drop policy if exists "Temporary MVP insert access" on public.maja_state;
create policy "Temporary MVP insert access"
  on public.maja_state for insert
  to anon, authenticated
  with check (id = 'main');

drop policy if exists "Temporary MVP update access" on public.maja_state;
create policy "Temporary MVP update access"
  on public.maja_state for update
  to anon, authenticated
  using (id = 'main')
  with check (id = 'main');
