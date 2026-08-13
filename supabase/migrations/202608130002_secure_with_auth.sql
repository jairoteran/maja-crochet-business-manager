-- Ejecutar después de crear y confirmar el usuario en Supabase Auth.
-- Elimina el acceso anónimo provisional y separa cada registro por auth.uid().

drop policy if exists "Temporary MVP read access" on public.maja_state;
drop policy if exists "Temporary MVP insert access" on public.maja_state;
drop policy if exists "Temporary MVP update access" on public.maja_state;

revoke all on table public.maja_state from anon;
grant select, insert, update on table public.maja_state to authenticated;

alter table public.maja_state
  drop constraint if exists maja_state_single_record;

drop policy if exists "Users read their own state" on public.maja_state;
create policy "Users read their own state"
  on public.maja_state for select
  to authenticated
  using (id = (select auth.uid())::text);

drop policy if exists "Users insert their own state" on public.maja_state;
create policy "Users insert their own state"
  on public.maja_state for insert
  to authenticated
  with check (id = (select auth.uid())::text);

drop policy if exists "Users update their own state" on public.maja_state;
create policy "Users update their own state"
  on public.maja_state for update
  to authenticated
  using (id = (select auth.uid())::text)
  with check (id = (select auth.uid())::text);

delete from public.maja_state where id = 'main';
