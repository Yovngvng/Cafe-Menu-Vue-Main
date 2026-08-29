-- Run in Supabase SQL editor. Lets a cron job ping the project cheaply.
create or replace function public.keepalive()
returns text
language sql
security definer
as $$
  select 'ok';
$$;

grant execute on function public.keepalive() to anon, authenticated;
