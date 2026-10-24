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

## Types

`src/lib/database.types.ts` is currently hand-written from the schema.
Regenerate it from the live database:

```bash
npx supabase login
SUPABASE_PROJECT_ID=<ref> npm run gen:types
```

## Deploy (Vercel)

New Vercel project from this repo with **Root Directory `admin`**, Node 20,
the three environment variables above for Production and Preview, and Vercel
Authentication enabled for preview deployments.

## Checks

```bash
npm run typecheck && npm run lint
npm run build && npm run check:secrets
```
