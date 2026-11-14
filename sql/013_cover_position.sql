-- Where the shop page crops the cover photo: the vertical focus point, 0 (top)
-- to 100 (bottom), set with a slider in the admin. Default 50 (centre), so
-- existing covers look as before. Run after 012, before deploying the
-- version that reads it. Safe to run twice.

alter table public.shops
  add column if not exists cover_position smallint not null default 50;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shops_cover_position_check') then
    alter table public.shops
      add constraint shops_cover_position_check check (cover_position between 0 and 100);
  end if;
end
$$;
