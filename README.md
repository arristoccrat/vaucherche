# Vaucherche.bg

Directory of gift vouchers sold by Bulgarian online shops. One Next.js 14
(App Router) app, one Vercel project:

- `/` — the public site (currently the coming soon page).
- `/admin` — internal admin: triage, verify, edit and publish shops. It reads
  and writes Supabase only; the crawler and AI pipeline run elsewhere.

See `CLAUDE.md` for the rules both parts follow.

## Local setup

```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev                  # public site at /, admin at /admin
```

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Publishable key, RLS-bound |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Secret key. Never `NEXT_PUBLIC_`. Used only by the admin |
| `SUPABASE_PROJECT_ID` | local only | For `npm run gen:types` |
| `SITE_LAUNCHED` | server | `true` in Production to replace the coming soon page with the site. Previews and `next dev` always show the site |
| `PREVIEW_TOKEN` | server | Before launch, opening `/?preview=<token>` once shows the real site in that browser for 30 days; `/?preview=off` switches back |

Supabase clients:

- `src/lib/supabase/public.ts` — publishable key, for the public site.
- `src/lib/supabase/server.ts` — admin pages; the signed-in user's session, RLS applies.
- `src/lib/supabase/admin.ts` — service role, `server-only`, admin Server Actions only.

## Supabase setup (once)

1. Authentication → Sign In / Providers → Email: keep the provider enabled
   and turn off **Allow new users to sign up** (do this before the RLS
   policies: signed-in users get full access).
2. Authentication → Users → **Add user → Create new user**: your email and a
   strong password, with **Auto Confirm User** ticked. That account signs in
   at `/admin/login`. To change the password later, use the user's menu in
   the same list.

## Database changes

SQL the admin depends on lives in `sql/`, numbered. Run each file once in the
Supabase SQL Editor **before** deploying the version that needs it (after the
Phase 0 RLS policies and indexes from the admin spec):

- `sql/001_editorial.sql` — `shops.description` and `shops.gift_appeal_rank`
  (editorial fields and the publish queue).
- `sql/002_ops_indexes.sql` — indexes for the `/admin/ops` counts and the list
  joins.
- `sql/003_shop_voucher_range.sql` — listing-card view: BGN-only prices
  ignoring zeros, normalised availability, card fields. Check what the
  static site generator (`08`) reads from this view before running it.
- `sql/004_shop_voucher_range_eur.sql` — the same view plus `min_eur`,
  `max_eur`, `denominations_eur` (merchant's euro price when listed in euros,
  otherwise converted). Supersedes 003: if 003 was never run, run only 004.
- `sql/005_admin_media_and_edits.sql` — `shops.cover_url`,
  `voucher_offers.human_edited_at`, the public `shop-media` storage bucket
  (PNG/JPEG/WebP/GIF/ICO, 2 MB) for logos and covers, and `cover_url` in the
  listing view.
- `sql/006_shop_voucher_range_browse.sql` — the listing view plus
  `gift_appeal_rank` and the latest offer's delivery, custom-amount and
  validity facts (a human-edited offer wins), for the public browse filters
  and cards. Run after 005.

**Pipeline rules the admin relies on** (in the crawler / AI scripts, outside
this repo):

- Never overwrite a `voucher_offers` row where `human_edited_at` is set —
  those facts were corrected by a person.
- Never write `shops.name`, `description`, `logo_url` or `cover_url`; they are
  editorial and owned by the admin.

## Types

`src/lib/database.types.ts` is hand-written from the schema. To regenerate it
from the live database:

```bash
npx supabase login
SUPABASE_PROJECT_ID=<ref> npm run gen:types
npm run typecheck && npm run build   # if this fails: git checkout -- src/lib/database.types.ts
```

## Deploy (Vercel)

One Vercel project builds the repo root: the public site, `/admin` and
`/coming-soon` deploy together.

### Environment variables

| Variable | Production | Preview | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | Without it in Preview, previews build but every page shows the error screen |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | Publishable key, RLS-bound |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | — | Secret key, never `NEXT_PUBLIC_`; the admin only |
| `PREVIEW_TOKEN` | ✓ | — | `/?preview=<token>` shows the real site on production before launch |
| `SITE_LAUNCHED` | `true` at launch | — | Until then production shows `/coming-soon` |

Nothing queries Supabase at build time, so a build never needs these to
succeed; pages read them per request.

### Protect previews

Settings → Deployment Protection → Vercel Authentication on, so branch URLs
are not publicly readable.

### Admin check after a deploy

Signed out, `/admin/shops`, `/admin/queue` and `/admin/ops` redirect to
`/admin/login`; email and password sign you in; `/admin/shops` shows the full
shop count (about 19,974) with its query time in the header.

### Launch checklist (public site)

1. Every file in `sql/` up to `006` has been run (see **Database changes**).
2. In `/admin/queue`, publish the shops that pass the gate. Nothing
   publishes itself.
3. Preview the real site on production with `/?preview=<PREVIEW_TOKEN>`:
   browse, a category, a shop page, a "Купи от" click, search.
4. Set `SITE_LAUNCHED=true` (Production) and redeploy. `/coming-soon` then
   redirects to `/`.
5. Point `vaucherche.bg` at the project (Settings → Domains). Canonical URLs,
   Open Graph and the sitemap already use `https://vaucherche.bg`.
6. Google Search Console: add the domain, submit
   `https://vaucherche.bg/sitemap.xml` (empty before launch, every published
   shop after).
7. Optional: set `CONTACT_EMAIL` in `src/lib/site.ts` to show it in the
   footer.

### Built in

- `npm run build` runs `check:secrets` afterwards (`postbuild`). It fails the
  build if `SUPABASE_SERVICE_ROLE` or the service key's value appears anywhere
  in `.next/static`, so a leak cannot deploy.
- `/admin` responses carry `X-Robots-Tag: noindex`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`; public pages carry `nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `strict-origin-when-cross-origin` and a
  `Permissions-Policy` that turns device APIs off. `robots.txt` disallows
  `/admin` and `/out/`.
- The middleware handles the admin session on `/admin` and the pre-launch
  gate everywhere else; admin pages are `force-dynamic`.
- Public reads are cached for an hour and revalidated by every admin save;
  pages stream with skeletons (`loading.tsx`), failures show a retry screen
  (`(public)/error.tsx`), unknown URLs a styled 404 (`src/app/not-found.tsx`).
- Listing queries stay well under the 300 ms budget: measured in PGlite with
  20,000 shops, 1,333 published and 100,000 products, the slowest browse query
  (home page, sorted) took 46 ms.
- The admin theme is scoped to `.admin-root` and always light; the public site
  keeps its own colours and follows the OS dark mode.

## What does not run here

The crawler and AI pipeline stay outside Vercel (they run for hours; Vercel
functions stop after 60–300 seconds). To trigger a crawl from the admin later,
add a jobs table the worker polls: the admin inserts a row, the worker picks
it up.

## Checks

```bash
npm run typecheck && npm run lint   # lint enforces the public/admin import boundary
npm test                            # colour contrast of every category and text token
npm run build                       # includes the secret check
```
