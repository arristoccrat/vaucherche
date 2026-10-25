-- Listing-card view with euro amounts. Run after 001_editorial.sql. Contains
-- the full definition, so it works whether or not 003 was run (it supersedes
-- it): existing columns keep their names, types and order; new ones are
-- appended at the end.
--
-- Euro amounts per product: the merchant's own price when it is listed in
-- euros, otherwise price_bgn converted at the fixed 1.95583 and rounded to
-- cents. Zero and missing prices are ignored, as in 003.
--
-- The BGN columns stay for anything still reading them (e.g. the static
-- site generator, script 08).

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
       count(e.price_eur) as priced_count,
       s.name,
       s.slug,
       s.description,
       s.logo_url,
       min(e.price_eur) as min_eur,
       max(e.price_eur) as max_eur,
       array_agg(distinct e.price_eur order by e.price_eur)
         filter (where e.price_eur is not null) as denominations_eur
from public.shops s
left join public.voucher_products p on p.shop_id = s.id
left join lateral (
  select case
           when upper(p.currency) = 'EUR' and p.price > 0 then p.price
           when p.price_bgn > 0 then round(p.price_bgn / 1.95583, 2)
         end as price_eur
) e on true
group by s.id;
