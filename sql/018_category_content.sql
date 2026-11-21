-- Copy for a category's public page, written in /admin/categories:
-- * intro: a short text under the heading (the rich-text format of
--   src/lib/rich-text.ts: paragraphs, **bold**, lists).
-- * faq: questions and answers at the bottom of the page, also given to
--   search engines as FAQPage data. A JSON array of {"q": …, "a": …}.
-- Run after 017, before deploying the version that reads it. Safe to run
-- twice. The public site already reads categories (sql/007), so no new
-- policy is needed.

alter table public.categories
  add column if not exists intro text,
  add column if not exists faq jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_intro_length') then
    alter table public.categories add constraint categories_intro_length check (intro is null or char_length(intro) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'categories_faq_shape') then
    alter table public.categories
      add constraint categories_faq_shape check (jsonb_typeof(faq) = 'array' and jsonb_array_length(faq) <= 12);
  end if;
end
$$;
