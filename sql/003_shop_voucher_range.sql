-- One row per shop for listing cards. Run after 001_editorial.sql (uses
-- shops.description). Replaces the earlier definition in place: existing
-- columns keep their names, types and order; new ones are appended.
--
-- Changes from the original view:
-- * Prices come only from price_bgn and only when > 0. Text-scraped zeros
--   ("choose an amount" fields) no longer make a card read "from 0 лв".
-- * denominations is in BGN (was the raw price in mixed BGN/EUR), so
--   currency is always 'BGN'. EUR is derived at display time (÷ 1.95583).
-- * any_in_stock understands every spelling seen in the data. NULL means
--   no product reported availability (unknown), not "out of stock".
-- * priced_count, name, slug, description, logo_url added for the cards.

create or replace view public.shop_voucher_range
with (security_invoker = true) as
select s.id,
       s.domain,
       s.category,
       s.subcategory,
       s.gift_appeal,
       s.published,
       count(p.id) as product_count,
       min(p.price_bgn) filter (where p.price_bgn > 0) as min_bgn,
       max(p.price_bgn) filter (where p.price_bgn > 0) as max_bgn,
       array_agg(distinct p.price_bgn order by p.price_bgn)
         filter (where p.price_bgn > 0) as denominations,
       'BGN'::text as currency,
       bool_or(lower(btrim(p.availability)) in ('in stock', 'instock', 'в наличност'))
         as any_in_stock,
       count(*) filter (where p.price_bgn > 0) as priced_count,
       s.name,
       s.slug,
       s.description,
       s.logo_url
from public.shops s
left join public.voucher_products p on p.shop_id = s.id
group by s.id;
