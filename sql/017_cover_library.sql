-- A library of covers, uploaded once in the admin (/admin/covers), given a
-- name, and picked for any shop from a list. Picking one writes its URL to
-- shops.cover_url, so the public site reads covers exactly as before.
-- Run after 016, before deploying the version that reads it. Safe to run
-- twice.
--
-- * url: our own copy in the shop-media bucket (covers/…), never a
--   merchant URL.
-- * archived_at: "deleted" covers leave the list (never DELETE); shops that
--   already use one keep it.
-- * Admin only: RLS on and no policies, so only the service role reads it.

create table if not exists public.cover_library (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  url text not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.cover_library enable row level security;

create index if not exists cover_library_active_idx on public.cover_library (name) where archived_at is null;
