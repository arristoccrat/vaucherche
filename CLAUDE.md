# Vaucherche

Directory of gift vouchers sold by Bulgarian online shops.

## Repo layout

- `/` — public site (vaucherche.bg). Next.js 14 App Router. Reads Supabase with
  the publishable/anon key only; RLS limits it to `published = true`.
- `/admin` — internal admin (`vaucherche-admin`). Next.js 14 App Router,
  TypeScript strict, Tailwind, shadcn/ui, `src/` layout. Deployed as its own
  Vercel project with Root Directory `admin`. Reads and writes Supabase; does
  not crawl and does not call the Anthropic API.
- The crawler / AI pipeline (`~/Desktop/Vaucherche/scripts/`) lives outside
  this repo and runs locally or on a persistent worker, never on Vercel.

The two apps have separate `package.json`, lockfile, ESLint and TS configs. Run
commands from the app's own directory.

## Data model notes

- `shops.status` is a workflow: `candidate`, `confirmed`, `ai_confirmed`,
  `needs_review`, `rejected`, `unreachable`. Use the `ShopStatus` union in
  `admin/src/lib/domain.ts`, never bare strings.
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
- Publishing is gated by `admin/src/lib/publish.ts` (checked in the UI and
  again in the Server Action); bulk publish skips shops that fail it.
- URL verification (`admin/src/actions/products.ts`): first line becomes
  `shops.voucher_url` with `voucher_url_verified = true`; every line is added
  to `voucher_products` as `source: 'manual'` with no price, only if that
  (shop, url) is not already there. Existing product rows are never updated
  or removed, so crawler prices survive re-verification.
- Heavy product columns (`raw_text`, `meta`, `links`, `description`) are
  fetched on demand from `/api/products/[id]/raw`, never in list queries.
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
- Prices display in BGN and EUR both. `price_bgn` is the sort key; the EUR peg
  is 1.95583.

### Do not

- **Do not put the service-role key anywhere a browser can reach it.** No
  `NEXT_PUBLIC_` prefix, no import of `admin/src/lib/supabase/admin.ts` into a
  Client Component. Keep `import 'server-only'` at the top of that file so a
  mistake fails the build instead of leaking silently. Use it only in Server
  Actions after `getUser()`, or in `unstable_cache`d aggregate reads (which
  cannot see the session cookie) behind a `requireUser()` wrapper — see
  `admin/src/lib/queries/shops.ts`.
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

### Checks before a phase is called done (run in `admin/`)

- `npm run typecheck` clean, no `any` on Supabase responses.
- `npm run lint` clean.
- `npm run build && npm run check:secrets` — no `SUPABASE_SERVICE_ROLE` in
  `.next/static`.
- Signed out, every admin route redirects to `/login`.
- The slowest list query runs under 300ms with filters applied.
