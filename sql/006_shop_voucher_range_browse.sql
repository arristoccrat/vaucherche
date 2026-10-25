-- Public browse page: listing view gains the sort rank and the card's offer
-- facts. View-only change, no table changes. Run after 005. Existing columns
-- keep their names, types and order; new ones are appended.
--
-- Offer facts come from one preferred offer per shop: a human-corrected one
-- first (human_edited_at), then the most recently extracted.

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
         filter (where e.price_eur is not null) as denominations_eur,
       s.cover_url,
       s.gift_appeal_rank,
       o.is_digital,
       o.is_physical,
       o.custom_amount,
       o.validity_months,
       o.delivery_methods
from public.shops s
left join public.voucher_products p on p.shop_id = s.id
left join lateral (
  select case
           when upper(p.currency) = 'EUR' and p.price > 0 then p.price
           when p.price_bgn > 0 then round(p.price_bgn / 1.95583, 2)
         end as price_eur
) e on true
left join lateral (
  select vo.is_digital, vo.is_physical, vo.custom_amount, vo.validity_months, vo.delivery_methods
  from public.voucher_offers vo
  where vo.shop_id = s.id
  order by vo.human_edited_at desc nulls last, vo.extracted_at desc nulls last
  limit 1
) o on true
group by s.id, o.is_digital, o.is_physical, o.custom_amount, o.validity_months, o.delivery_methods;
