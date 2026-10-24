-- Phase 6 (ops dashboard + list performance). Safe to run any time; every
-- statement is idempotent.

-- /ops counts crawl requests per day and in the last 24 hours.
create index if not exists fetch_log_fetched_at_idx
  on public.fetch_log (fetched_at desc);

-- The shops list embeds offers and products per shop; these keep the joins
-- index-backed. (voucher_products may already be covered by its
-- (shop_id, url) unique index — then this one is redundant but harmless.)
create index if not exists voucher_offers_shop_id_idx
  on public.voucher_offers (shop_id);
create index if not exists voucher_products_shop_id_idx
  on public.voucher_products (shop_id);

-- /ops counts products by how their price was obtained.
create index if not exists voucher_products_source_idx
  on public.voucher_products (source);
