-- City-specific shops: a shop whose voucher is used on the spot in one
-- place ("Само в Пловдив"). Run after 011. Safe to run twice.
--
-- * shops.local_only: the voucher is used on the spot, not online or across
--   the country. Set in the admin.
-- * shops.city: the city it is tied to, a key from src/lib/cities.ts
--   ("plovdiv"), or null when local but the city is not known ("Само на
--   място": no city filter).
-- * shop_voucher_range gains city and local_only at the end, for the public
--   cards and the ?grad= filter; every other column is as in 011.

alter table public.shops
  add column if not exists local_only boolean not null default false,
  add column if not exists city text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shops_city_key_check') then
    alter table public.shops
      add constraint shops_city_key_check check (city is null or city ~ '^[a-z]+(-[a-z]+)*$');
  end if;
end
$$;

create index if not exists shops_city_published_idx on public.shops (city) where published and city is not null;

do $migration$
declare
  eur_type text;
  eur_array_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into eur_type
  from pg_attribute a
  where a.attrelid = 'public.shop_voucher_range'::regclass and a.attname = 'min_eur';

  select format_type(a.atttypid, a.atttypmod) into eur_array_type
  from pg_attribute a
  where a.attrelid = 'public.shop_voucher_range'::regclass and a.attname = 'denominations_eur';

  execute format($view$
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
       o.min_eur::%1$s as min_eur,
       o.max_eur::%1$s as max_eur,
       o.denominations_eur::%2$s as denominations_eur,
       s.cover_url,
       s.gift_appeal_rank,
       o.is_digital,
       o.is_physical,
       o.custom_amount,
       o.validity_months,
       o.delivery_methods,
       lower(concat_ws(' ',
         s.name, s.domain, s.subcategory, s.description, s.voucher_description, cat.label,
         string_agg(distinct p.title, ' ')
       )) as search_text,
       s.city,
       s.local_only
from public.shops s
left join public.categories cat on cat.key = s.category
left join public.voucher_products p on p.shop_id = s.id
left join lateral (
  select case
           when upper(p.currency) = 'EUR' and p.price > 0 then p.price
           when p.price_bgn > 0 then round(p.price_bgn / 1.95583, 2)
         end as price_eur
) e on true
left join lateral (
  select vo.is_digital, vo.is_physical, vo.custom_amount, vo.validity_months, vo.delivery_methods,
         amounts.denominations_eur,
         least(amounts.lo, case when vo.custom_amount then custom.lo end) as min_eur,
         greatest(amounts.hi, case when vo.custom_amount then custom.hi end) as max_eur
  from public.voucher_offers vo
  cross join lateral (
    select array_agg(distinct v.eur order by v.eur) as denominations_eur,
           min(v.eur) as lo,
           max(v.eur) as hi
    from unnest(vo.denominations) as d(amount)
    cross join lateral (
      select case
               when upper(coalesce(vo.currency, 'BGN')) = 'EUR' then round(d.amount::numeric, 2)
               else round(d.amount::numeric / 1.95583, 2)
             end as eur
    ) v
    where d.amount > 0
  ) amounts
  cross join lateral (
    select case
             when vo.min_value > 0 then
               case when upper(coalesce(vo.currency, 'BGN')) = 'EUR' then round(vo.min_value::numeric, 2)
                    else round(vo.min_value::numeric / 1.95583, 2) end
           end as lo,
           case
             when vo.max_value > 0 then
               case when upper(coalesce(vo.currency, 'BGN')) = 'EUR' then round(vo.max_value::numeric, 2)
                    else round(vo.max_value::numeric / 1.95583, 2) end
           end as hi
  ) custom
  where vo.shop_id = s.id
  order by vo.human_edited_at desc nulls last, vo.extracted_at desc nulls last
  limit 1
) o on true
group by s.id, o.is_digital, o.is_physical, o.custom_amount, o.validity_months, o.delivery_methods,
         o.min_eur, o.max_eur, o.denominations_eur, cat.label
$view$, eur_type, eur_array_type);
end
$migration$;
