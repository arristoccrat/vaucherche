-- Admin: pictures and human-corrected voucher facts. Run after 004.

-- 1. A cover picture per shop (the card's header band), next to logo_url.
alter table public.shops
  add column if not exists cover_url text;

-- 2. When a person last corrected an offer's facts in the admin. The crawl /
--    AI pipeline must not overwrite an offer row where this is set.
alter table public.voucher_offers
  add column if not exists human_edited_at timestamptz;

-- 3. Storage for logos and covers, so the site serves its own copies instead
--    of hotlinking merchant images. Public read; uploads only through the
--    admin's server code (service role), so no write policies are needed.
--    SVG is not allowed: it can carry scripts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4. The listing view gains cover_url (appended; definition otherwise as 004).
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
       s.cover_url
from public.shops s
left join public.voucher_products p on p.shop_id = s.id
left join lateral (
  select case
           when upper(p.currency) = 'EUR' and p.price > 0 then p.price
           when p.price_bgn > 0 then round(p.price_bgn / 1.95583, 2)
         end as price_eur
) e on true
group by s.id;
