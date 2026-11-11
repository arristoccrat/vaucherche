-- The wording of the shop page's one button: "Купи от <shop>" (buy, the
-- default) or "Повече на <shop>" (more), for shops whose voucher page is
-- better read than bought from straight away. Chosen in the admin next to
-- the voucher page. Run after 009, before deploying the version that reads
-- it. Safe to run twice.

alter table public.shops
  add column if not exists cta_kind text not null default 'buy';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shops_cta_kind_check') then
    alter table public.shops
      add constraint shops_cta_kind_check check (cta_kind in ('buy', 'more'));
  end if;
end
$$;
