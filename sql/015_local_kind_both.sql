-- shops.local_kind (sql/014) gains 'both': the voucher is used on the spot
-- and the shop also delivers in its city. Run after 014, before deploying
-- the version that offers it. Safe to run twice.

alter table public.shops drop constraint if exists shops_local_kind_check;
alter table public.shops
  add constraint shops_local_kind_check check (local_kind in ('on_site', 'delivery', 'both'));
