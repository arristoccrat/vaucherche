# Vaucherche

Directory of gift vouchers sold by Bulgarian online shops.

## Repo layout

One Next.js 14 App Router app (TypeScript strict, Tailwind, shadcn/ui,
`src/` layout), deployed as one Vercel project. Two route groups, no group
name in any URL:

- `src/app/(public)/` — public site (vaucherche.bg). Reads Supabase only
  through `src/lib/supabase/public.ts` (publishable key); RLS limits it to
  `published = true`. Writes nothing. Its own fonts, header and footer live
  in `(public)/layout.tsx` and `(public)/_components/`.
- `src/app/(admin)/admin/` — internal admin at `/admin`. Reads and writes
  Supabase; does not crawl and does not call the Anthropic API.
  `(auth)/login` is public (email + password via Supabase Auth; sign-ups
  disabled, users are created in the dashboard), `(console)/` requires a
  session; `api/products/[id]/raw` is a route handler. The middleware
  (`src/middleware.ts`) handles the admin session for `/admin` and the
  pre-launch gate for public URLs.
- Admin code: `src/actions/` (Server Actions), `src/lib/queries/`,
  `src/lib/supabase/{server,admin}.ts`.
- Shared: `src/lib/brand.ts` (public palette), `src/lib/categories.ts` (the
  18 categories: colour, Bulgarian label, URL path), `src/components/`.
  Shared code imports no Supabase client and takes data as props.
- `sql/` — schema changes run by hand in the Supabase SQL Editor.
- The crawler / AI pipeline (`~/Desktop/Vaucherche/scripts/`) lives outside
  this repo and runs locally or on a persistent worker, never on Vercel.

**The import boundary is the security model.** ESLint
(`no-restricted-imports` in `.eslintrc.json`) fails lint and the build if
anything under `src/app/(public)/` imports the admin client, the session
client, `src/lib/queries/*`, `src/actions/*` or `(admin)` code, or if shared
code imports any Supabase client. `server-only` on `admin.ts` stops a Client
Component from importing it. Keep both.

Every admin path is prefixed with `/admin` (links, redirects,
`revalidatePath`, `fetch`). Admin styles live under `.admin-root` in
`src/app/globals.css` and stay light; don't change the public `:root` colours
to suit the admin.

Pre-launch: `src/middleware.ts` rewrites every public URL on production to
`/coming-soon` (`src/app/(prelaunch)/`) until `SITE_LAUNCHED=true` is set in
Vercel; previews and `next dev` show the real site. `/?preview=<PREVIEW_TOKEN>`
sets a 30-day cookie that shows the real site on production; `/?preview=off`
clears it. This gate decides presentation, not access: public pages only
ever read published shops. Fonts for both groups come from `src/lib/fonts.ts`.

## Data model notes

- `shops.status` is a workflow: `candidate`, `confirmed`, `ai_confirmed`,
  `needs_review`, `rejected`, `unreachable`. Use the `ShopStatus` union in
  `src/lib/domain.ts`, never bare strings.
- `ai_confirmed` is a machine verdict (≥0.8 confidence); `confirmed` has crawler
  evidence or a human behind it. Never merge them in queries or UI.
- Three independent booleans: `shops.voucher_url_verified` (human confirmed the
  landing page), `voucher_offers.verified_by_human` (human confirmed the shop
  sells vouchers), `shops.published` (staged for the public site).
- `voucher_products.source`: `og` / `jsonld` are structured and reliable,
  `text` was regex-scraped and needs a glance, `manual` is a human-pasted URL
  with no price fetched yet. Surface it.
- Human verdicts from the admin: confirming writes `status_reason =
  'потвърден от човек'` and sets `voucher_offers.verified_by_human = true` +
  `verified_at`; rejecting writes `'отхвърлен от човек'` and
  `verified_by_human = false`. A human can never set `ai_confirmed`. Bulk
  confirm is refused outright if any target's `status_reason` starts with
  `AI rejected`.
- Publishing is gated by `src/lib/publish.ts` (checked in the UI and
  again in the Server Action); bulk publish skips shops that fail it. The
  gate: status confirmed/ai_confirmed, verified voucher URL, category, a
  human-written name (not the domain), and a description.
- Editorial fields (`name`, `description`, `logo_url`, `category`,
  `subcategory`, `gift_appeal`) autosave one at a time via
  `src/actions/editorial.ts`. `description` is our own copy written
  from the facts, never the merchant's text.
- Schema changes the admin depends on live in `sql/` and are run by hand in
  the Supabase SQL Editor before deploying; update
  `src/lib/database.types.ts` to match.
- URL verification (`src/actions/products.ts`): first line becomes
  `shops.voucher_url` with `voucher_url_verified = true`; every line is added
  to `voucher_products` as `source: 'manual'` with no price, only if that
  (shop, url) is not already there. Existing product rows are never updated
  or removed, so crawler prices survive re-verification.
- Heavy product columns (`raw_text`, `meta`, `links`, `description`) are
  fetched on demand from `/admin/api/products/[id]/raw`, never in list queries.
- `status_reason` carries the AI evidence, e.g.
  `AI confirmed (0.92): подаръчен ваучер 50 лв`. Split on the first colon and
  show the quote prominently.

## Conventions and guardrails

### Standing rules

- Server Components by default. `'use client'` only for interaction, pushed to
  the smallest leaf possible.
- All data fetching in Server Components or Server Actions. No `useEffect`
  fetching.
- Filter and pagination state in `searchParams`, never `useState`.
- Every Server Action: `getUser()` check → Zod validation → mutation →
  `revalidatePath`.
- Interface language is Bulgarian; category slugs, status values and column
  names stay English.
- All amounts display in euros only (`src/lib/format.ts`: `productEur`,
  `toEur`, `formatEur*`). Stored values stay as scraped (`price` +
  `currency`, and `price_bgn`); use the scraped price when it is already in
  EUR, otherwise convert at the fixed 1.95583. `price_bgn` stays the sort key.
  The public site reads euro amounts from `shop_voucher_range`
  (`min_eur`, `max_eur`, `denominations_eur`, same rule, `sql/004`).

- Public design: colours only via `brand-*` Tailwind tokens and
  `src/lib/categories.ts`; a hex code in a component is a bug. Fonts:
  Unbounded (`font-display`), Manrope (`font-ui`), IBM Plex Mono
  (`font-num`, all amounts, counts and dates), all with the Cyrillic subset.
  2px `brand-ink` borders; amber only for selected state and the primary
  CTA. `npm test` checks every category and text token clears 4.5:1.

### Do not

- **Do not put the service-role key anywhere a browser can reach it.** No
  `NEXT_PUBLIC_` prefix, no import of `src/lib/supabase/admin.ts` into a
  Client Component, and never import it (or `server.ts`) from public-site
  pages — they use `src/lib/supabase/public.ts` only. Keep `import 'server-only'` at the top of that file so a
  mistake fails the build instead of leaking silently. Use it only in Server
  Actions after `getUser()`, or in `unstable_cache`d aggregate reads (which
  cannot see the session cookie) behind a `requireUser()` wrapper — see
  `src/lib/queries/shops.ts`.
- **Do not port the crawler to a Vercel route handler.** `02a-fetch.js` runs for
  hours across thousands of hosts. Serverless functions cap at 60 seconds on
  Hobby, 300 on Pro. If the admin ever triggers a crawl, it inserts a job row
  into a queue table that a persistent worker polls.
- **Do not merge `confirmed` and `ai_confirmed`.** They are different epistemic
  claims and the distinction is the reason anyone should trust the directory.
- **Do not auto-publish anything.** No rule, no threshold, no "confidence above
  0.9 goes live". A human sets `published`, always.
- **Do not delete rows.** Rejected and unreachable shops are the record of what
  was checked. Change status; never `DELETE`.
- **Do not fetch all rows client-side to filter in the browser.** Supabase caps
  `select()` at 1,000 rows by default — a bare select silently returns the
  first thousand and looks like it worked. Paginate server-side with `.range()`.
- **Do not render merchant `raw_text` as HTML.** Some crawled pages carry
  injected scripts. Plain text in a `<pre>` only.
- **Do not copy merchant product descriptions into listings.** Use the facts,
  write the copy.

### Deployment (admin)

- `npm run build` runs `check:secrets` as `postbuild`; never remove it. It
  fails the build if the service key (name or value) is in `.next/static`.
- Security headers for `/admin` live in `next.config.mjs`; the deploy
  checklist is in `README.md`.

### Checks before a change is called done

- `npm run typecheck` clean, no `any` on Supabase responses.
- `npm run lint` clean (includes the import boundary).
- `npm test` green (contrast).
- `npm run build && npm run check:secrets` — no `SUPABASE_SERVICE_ROLE` in
  `.next/static`.
- Signed out, every admin route redirects to `/admin/login`.
- The slowest list query runs under 300ms with filters applied.
