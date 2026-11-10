-- The voucher's own description, shown in full on the shop page
-- (/magazin/<slug>). shops.description stays the short shop description on
-- the cards. Editorial: written in the admin, never by the crawl / AI
-- pipeline. Run after 007. Idempotent.

alter table public.shops
  add column if not exists voucher_description text;
