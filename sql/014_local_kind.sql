-- How a city-specific shop serves its city (sql/012): the voucher is used on
-- the spot ('on_site', the default) or the shop delivers only in that city
-- ('delivery'). Shown under "Само в …" on the shop page. Run after 013,
-- before deploying the version that reads it. Safe to run twice.

alter table public.shops
  add column if not exists local_kind text not null default 'on_site';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shops_local_kind_check') then
    alter table public.shops
      add constraint shops_local_kind_check check (local_kind in ('on_site', 'delivery'));
  end if;
end
$$;
