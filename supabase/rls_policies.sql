-- Cafe Zhovan: Row Level Security
-- Run AFTER supabase/01_orders_schema.sql
-- Anon (customers): insert waiting orders + read/insert ratings.
-- Authenticated (admin): full access to orders.

alter table public.orders enable row level security;
alter table public.ratings enable row level security;

drop policy if exists "anon_insert_orders" on public.orders;
drop policy if exists "admin_select_orders" on public.orders;
drop policy if exists "admin_insert_orders" on public.orders;
drop policy if exists "admin_update_orders" on public.orders;
drop policy if exists "admin_delete_orders" on public.orders;
drop policy if exists "anon_select_ratings" on public.ratings;
drop policy if exists "anon_insert_ratings" on public.ratings;
drop policy if exists "admin_all_ratings" on public.ratings;

create policy "anon_insert_orders"
on public.orders
for insert
to anon
with check (
  status is null or status = 'در انتظار'
);

create policy "admin_select_orders"
on public.orders
for select
to authenticated
using (true);

create policy "admin_insert_orders"
on public.orders
for insert
to authenticated
with check (true);

create policy "admin_update_orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

create policy "admin_delete_orders"
on public.orders
for delete
to authenticated
using (true);

create policy "anon_select_ratings"
on public.ratings
for select
to anon, authenticated
using (true);

create policy "anon_insert_ratings"
on public.ratings
for insert
to anon, authenticated
with check (true);

create policy "admin_all_ratings"
on public.ratings
for all
to authenticated
using (true)
with check (true);

grant usage, select on sequence public.orders_order_number_seq to anon, authenticated;
grant insert on table public.orders to anon;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert on table public.ratings to anon, authenticated;
grant update, delete on table public.ratings to authenticated;

alter table public.orders replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
