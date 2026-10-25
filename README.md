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

## Types

`src/lib/database.types.ts` is hand-written from the schema. To regenerate it
from the live database:

```bash
npx supabase login
SUPABASE_PROJECT_ID=<ref> npm run gen:types
npm run typecheck && npm run build   # if this fails: git checkout -- src/lib/database.types.ts
```

## Deploy (Vercel)

The existing Vercel project builds the repo root, so `/admin` deploys with the
site. In that project:

1. **Environment variables** (Production and Preview): add
   `SUPABASE_SERVICE_ROLE_KEY` (the secret key, never with `NEXT_PUBLIC_`)
   next to the two public ones.
2. **Protect previews** — Settings → Deployment Protection → Vercel
   Authentication on, so branch URLs are not publicly readable.
3. Redeploy, then check: signed out, `/admin/shops`, `/admin/queue` and
   `/admin/ops` redirect to `/admin/login`; email and password sign you in;
   `/admin/shops` shows the full shop count (about 19,974) with its query time
   in the header.

Built in:

- `npm run build` runs `check:secrets` afterwards (`postbuild`). It fails the
  build if `SUPABASE_SERVICE_ROLE` or the service key's value appears anywhere
  in `.next/static`, so a leak cannot deploy.
- `/admin` responses carry `X-Robots-Tag: noindex`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`; `robots.txt` disallows `/admin`.
- The middleware only runs on `/admin`; admin pages are `force-dynamic`.
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
