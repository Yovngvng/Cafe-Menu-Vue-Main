create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint,
  customer_name text,
  order_type text,
  table_number text,
  note text,
  status text default 'در انتظار',
  total numeric,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  product_name text not null,
  rating integer not null
);

-- 1) Add relational columns (safe if they already exist)
alter table if exists public.orders
  add column if not exists customer_name text,
  add column if not exists order_type text,
  add column if not exists table_number text,
  add column if not exists note text,
  add column if not exists status text default 'در انتظار',
  add column if not exists total numeric,
  add column if not exists items jsonb default '[]'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 2) If the old primary key is an integer `id`, keep the number as order_number and switch PK to uuid
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'id'
      and data_type in ('bigint', 'integer')
  ) then
    alter table public.orders drop constraint if exists orders_pkey;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'order_number'
    ) then
      update public.orders set order_number = coalesce(order_number, id);
      alter table public.orders drop column id;
    else
      alter table public.orders rename column id to order_number;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'id'
    ) then
      alter table public.orders add column id uuid default gen_random_uuid();
    end if;

    update public.orders set id = gen_random_uuid() where id is null;
    alter table public.orders alter column id set not null;
    alter table public.orders add primary key (id);
  end if;
end $$;

alter table public.orders add column if not exists order_number bigint;

-- New installs: ensure uuid id exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'id'
  ) then
    alter table public.orders add column id uuid default gen_random_uuid() primary key;
  end if;
end $$;

-- Kitchen-friendly sequential number
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'order_number'
  ) then
    update public.orders
    set order_number = coalesce(order_number, 0)
    where order_number is null;
  end if;
end $$;

create sequence if not exists public.orders_order_number_seq;

select setval(
  'public.orders_order_number_seq',
  greatest(coalesce((select max(order_number) from public.orders), 1), 1)
);

alter table public.orders
  alter column order_number set default nextval('public.orders_order_number_seq');

-- 3) Copy fields out of legacy JSON `data`
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'data'
  ) then
    update public.orders
    set
      customer_name = coalesce(customer_name, data->>'customerName', data->>'customer_name'),
      order_type = coalesce(nullif(order_type, ''), data->>'location', data->>'order_type'),
      table_number = coalesce(table_number, data->>'tableNumber', data->>'table_number'),
      note = coalesce(note, data->>'note'),
      status = coalesce(
        nullif(status, ''),
        case
          when data->>'status' in ('در حال آماده سازی') then 'در انتظار'
          when data->>'status' in ('آماده') then 'آماده شد'
          else coalesce(data->>'status', 'در انتظار')
        end
      ),
      total = coalesce(total, nullif(data->>'total', '')::numeric),
      items = coalesce(items, data->'items', '[]'::jsonb),
      created_at = coalesce(
        created_at,
        to_timestamp(nullif(data->>'createdAt', '')::double precision / 1000),
        to_timestamp(nullif(data->>'createAt', '')::double precision / 1000),
        now()
      )
    where data is not null;
  end if;
end $$;

alter table public.orders
  alter column status set default 'در انتظار';

alter table public.orders
  alter column items set default '[]'::jsonb;

-- 4) updated_at trigger
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure public.set_orders_updated_at();

-- 5) Drop the old JSON blob after a successful copy
alter table public.orders drop column if exists data;
