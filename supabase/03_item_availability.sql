-- Daily juice/cake availability. date is Jalali cafe-day text in Asia/Tehran.

create table if not exists public.item_availability (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  date text not null,
  is_available boolean not null default false,
  constraint item_availability_item_key_date_key unique (item_key, date)
);

alter table public.item_availability enable row level security;

drop policy if exists "anon_select_availability" on public.item_availability;
drop policy if exists "admin_select_availability" on public.item_availability;
drop policy if exists "admin_write_availability" on public.item_availability;

create policy "anon_select_availability"
on public.item_availability
for select
to anon, authenticated
using (true);

create policy "admin_write_availability"
on public.item_availability
for all
to authenticated
using (true)
with check (true);

grant select on table public.item_availability to anon, authenticated;
grant insert, update, delete on table public.item_availability to authenticated;

alter table public.item_availability replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.item_availability;
exception
  when duplicate_object then null;
end $$;
