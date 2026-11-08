-- Categories become data: edited in /admin/categories instead of code.
-- Run after 006. Idempotent: safe to run again; existing rows are kept.
--
-- key            stored in shops.category; never changes once created
-- label          Bulgarian name shown on the site
-- path           Latin URL segment: /kategoriya/<path>
-- previous_paths old paths after a URL change; they redirect to path
-- bg, on_color   band colour and the text colour on it (the admin only
--                saves pairs that clear 4.5:1)
-- icon           a name from src/lib/category-icons.tsx
-- archived_at    "deleted": hidden everywhere, kept for the record and
--                restorable; never DELETE a row

create table if not exists public.categories (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  label text not null check (char_length(btrim(label)) between 1 and 40),
  path text not null unique check (path ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  previous_paths text[] not null default '{}',
  bg text not null check (bg ~ '^#[0-9A-Fa-f]{6}$'),
  on_color text not null check (on_color in ('ink', 'white')),
  icon text not null default 'Gift',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The public site (publishable key) reads active categories only. Writes go
-- through the admin's server code with the service role, so there are no
-- write policies.
alter table public.categories enable row level security;

drop policy if exists "Active categories are public" on public.categories;
create policy "Active categories are public" on public.categories
  for select to anon, authenticated
  using (archived_at is null);

grant select on public.categories to anon, authenticated;

-- The 18 categories the site launched with (src/lib/categories.ts).
insert into public.categories (key, label, path, bg, on_color, icon, sort_order) values
  ('spa-wellness', 'Спа и уелнес', 'spa-i-uelnes', '#6FC4A2', 'ink', 'Flower2', 10),
  ('experience', 'Преживявания', 'prezhivyavaniya', '#D5431A', 'white', 'Mountain', 20),
  ('food-drink', 'Храна и напитки', 'hrana-i-napitki', '#A85D00', 'white', 'Utensils', 30),
  ('beauty', 'Красота', 'krasota', '#C2185B', 'white', 'Sparkles', 40),
  ('books-music', 'Книги', 'knigi', '#1A4FD6', 'white', 'BookOpen', 50),
  ('toys-kids', 'Детски', 'detski', '#7A1FD4', 'white', 'ToyBrick', 60),
  ('fashion', 'Мода', 'moda', '#10302A', 'white', 'Shirt', 70),
  ('home', 'За дома', 'za-doma', '#1B6B8C', 'white', 'House', 80),
  ('sport-outdoor', 'Спорт', 'sport', '#0F7A5C', 'white', 'Dumbbell', 90),
  ('flowers-gifts', 'Цветя и подаръци', 'tsvetya-i-podaratsi', '#FBB03B', 'ink', 'Heart', 100),
  ('restaurant', 'Ресторанти', 'restoranti', '#9C2A2A', 'white', 'UtensilsCrossed', 110),
  ('jewellery', 'Бижута', 'bizhuta', '#8A6A00', 'white', 'Gem', 120),
  ('electronics', 'Електроника', 'elektronika', '#2F3E57', 'white', 'Smartphone', 130),
  ('travel-hotel', 'Пътувания и хотели', 'patuvaniya-i-hoteli', '#6A4C93', 'white', 'Plane', 140),
  ('pets', 'Домашни любимци', 'domashni-lyubimtsi', '#7A4E2D', 'white', 'PawPrint', 150),
  ('health-pharmacy', 'Здраве и аптеки', 'zdrave-i-apteki', '#2E6B30', 'white', 'HeartPulse', 160),
  ('auto', 'Авто', 'avto', '#4A4F57', 'white', 'Car', 170),
  ('other', 'Други', 'drugi', '#5C6B66', 'white', 'Gift', 180)
on conflict (key) do nothing;
