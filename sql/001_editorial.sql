-- Editorial fields + publish queue. Run once in the Supabase SQL Editor
-- BEFORE deploying the version that uses these columns.

-- Human-written listing copy. Two sentences, original text written from the
-- facts — never the merchant's own description.
alter table public.shops
  add column if not exists description text;

-- Sort key for the publish queue: PostgREST cannot ORDER BY a CASE
-- expression, so the ranking lives in a generated column.
alter table public.shops
  add column if not exists gift_appeal_rank smallint
  generated always as (
    case gift_appeal
      when 'high' then 1
      when 'medium' then 2
      when 'low' then 3
      else 4
    end
  ) stored;

create index if not exists shops_queue_order_idx
  on public.shops (gift_appeal_rank, category, domain);
