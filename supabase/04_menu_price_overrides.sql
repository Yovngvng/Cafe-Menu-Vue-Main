-- Admin price overrides. price is thousands of toman (same unit as menuData).

create table if not exists public.menu_price_overrides (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  price integer not null
);

alter table public.menu_price_overrides enable row level security;

drop policy if exists "anon_select_prices" on public.menu_price_overrides;
drop policy if exists "admin_write_prices" on public.menu_price_overrides;

create policy "anon_select_prices"
on public.menu_price_overrides
for select
to anon, authenticated
using (true);

create policy "admin_write_prices"
on public.menu_price_overrides
for all
to authenticated
using (true)
with check (true);

grant select on table public.menu_price_overrides to anon, authenticated;
grant insert, update, delete on table public.menu_price_overrides to authenticated;
