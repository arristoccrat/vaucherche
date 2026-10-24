# Vaucherche Admin

Internal admin for vaucherche.bg: triage, verify and publish shops. It reads
and writes Supabase only — the crawler and AI pipeline run elsewhere. See the
repo root `CLAUDE.md` for the rules.

## Local setup

```bash
cd admin
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Publishable key, RLS-bound |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Secret key. Never `NEXT_PUBLIC_` |
| `SUPABASE_PROJECT_ID` | local only | For `npm run gen:types` |

## Supabase setup (once)

1. Authentication → Users → add your own user.
2. Authentication → Sign In / Providers → Email → turn off **Allow new users to
   sign up**.
3. Authentication → URL Configuration → add redirect URLs:
   `http://localhost:3000/auth/callback` and
   `https://<admin-domain>/auth/callback` (plus the Vercel preview pattern if
   you sign in on previews).

## Database changes

SQL the admin depends on lives in `sql/`, numbered. Run each file once in the
Supabase SQL Editor **before** deploying the admin version that needs it:

- `sql/001_editorial.sql` — `shops.description` and `shops.gift_appeal_rank`
  (Phase 5: editorial fields and the publish queue).
- `sql/002_ops_indexes.sql` — indexes for the `/ops` counts and the list
  joins (Phase 6).
- `sql/003_shop_voucher_range.sql` — listing-card view: BGN-only prices
  ignoring zeros, normalised availability, card fields. Check what the
  static site generator (`08`) reads from this view before running it.

## Types

`src/lib/database.types.ts` is currently hand-written from the schema.
Regenerate it from the live database:

```bash
npx supabase login
SUPABASE_PROJECT_ID=<ref> npm run gen:types
```

## Deploy (Vercel)

One-time setup, in this order:

1. **Database** — in the Supabase SQL Editor run the Phase 0 RLS policies and
   indexes from the spec, then every file in `sql/` in order.
2. **Supabase Auth** — add your user (Authentication → Users), turn off new
   sign-ups, and add `https://<admin-domain>/auth/callback` to the redirect
   URLs (plus `https://*-<team>.vercel.app/auth/callback` if you sign in on
   preview deployments).
3. **Vercel project** — *Add New → Project*, import this repo, set
   **Root Directory = `admin`** (framework: Next.js, Node 20).
4. **Environment variables** (Production and Preview):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` — the secret key, never with a
   `NEXT_PUBLIC_` prefix.
5. **Protect previews** — Settings → Deployment Protection → Vercel
   Authentication on, so branch URLs are not publicly readable.
6. Optional: Settings → Git → *Ignored Build Step* `git diff --quiet HEAD^ HEAD -- .`
   so admin deploys only when `admin/` changes (and the reverse on the public
   site's project: `git diff --quiet HEAD^ HEAD -- . ':!admin'`).

Built in:

- `npm run build` runs `check:secrets` afterwards (`postbuild`). It fails the
  build if `SUPABASE_SERVICE_ROLE` or the service key's value appears anywhere
  in `.next/static`, so a leak cannot deploy.
- Every response carries `X-Robots-Tag: noindex`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`; `robots.txt` disallows everything.
- Admin pages are `force-dynamic`, so they are never rendered at build time.

After the first deploy, check: signed out, `/shops`, `/queue` and `/ops`
redirect to `/login`; the magic link signs you in; `/shops` shows the full
shop count (about 19,974) and its header shows the query time.

## What does not run here

The crawler and AI pipeline stay outside Vercel (they run for hours; Vercel
functions stop after 60–300 seconds). To trigger a crawl from the admin later,
add a jobs table the worker polls: the admin inserts a row, the worker picks
it up.

## Checks

```bash
npm run typecheck && npm run lint
npm run build && npm run check:secrets
```
