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
  Every public fetch is cached for an hour under the `public-data` tag
  (`PUBLIC_DATA_TAG` in `src/lib/site.ts`); every admin action that changes
  shop data calls `revalidateTag(PUBLIC_DATA_TAG)`, so keep that in new
  actions. Browse filters live in the URL (`(public)/_lib/browse-params.ts`):
  one category is the path (`/kategoriya/<path>`, built only by
  `browseHref` / `browsePath`; `/?kategoriya=<one key>` redirects there),
  several are `/?kategoriya=<key>,<key>` on the home page; the rest are
  comma-list query parameters. Every filter takes several choices (any
  matches); filters combine with "and" (`amountFilter`, `deliveryFilter`,
  `allOf`), and the chosen ones show as removable chips above the list
  (`ActiveFilters`). `?dostavka=` (digital, delivery, in_store) matches
  the admin's "Получаване" (`delivery_methods`, crawler words included,
  `deliveryFilter`). `?grad=` (city keys from `src/lib/cities.ts`) shows only
  shops tied to those cities (`shops.local_only` + `city`, `sql/012`); the
  rail lists cities with 8+ shops and folds the rest under "Още N града".
  A local shop reads "Само в Пловдив" (or "Само на място" without a city,
  which no city filter matches) on its card and shop page. The queries in
  `(public)/_lib/browse.ts` read
  `shop_voucher_range` (`sql/006`), always paginated with `.range()`.
  Public pages and `sitemap.xml` render per request (fetches stay cached):
  nothing may query Supabase at build time, because Preview builds have no
  database variables.
  The shop page `/magazin/[slug]` loads one published shop with its
  preferred offer and product rows in a single embedded query
  (`(public)/_lib/shop.ts`). Merchant URLs reach an `href` only through
  `externalUrl()` (http/https only); links out carry
  `rel="nofollow noopener noreferrer"`. The shop page lists its amounts
  (and "Сума по избор" with its limits) as plain facts; the one buy button
  links to `/out/[slug]` (`(public)/_lib/outbound.ts`), which looks up the
  verified voucher page (else the first product page) and 302s there. It
  reads nothing from the query, so it is not an open redirect. Keep it so.
  Search (`/tarsene?q=`) matches `shop_voucher_range.search_text`
  (`sql/011`: name, domain, subcategory, both descriptions, category name,
  product titles): every word must appear, as typed or transliterated
  (`searchFilter`); before 011 it falls back to the old columns. The
  query passes `normalizeQuery()` first (letters, digits, spaces only), which
  is what makes putting it into the PostgREST filter safe; keep it.
- `src/app/(admin)/admin/` — internal admin at `/admin`. Reads and writes
  Supabase; does not crawl and does not call the Anthropic API.
  `(auth)/login` is public (email + password via Supabase Auth; sign-ups
  disabled, users are created in the dashboard), `(console)/` requires a
  session. The middleware
  (`src/middleware.ts`) handles the admin session for `/admin` and the
  pre-launch gate for public URLs.
- Admin code: `src/actions/` (Server Actions), `src/lib/queries/`,
  `src/lib/supabase/{server,admin}.ts`.
- Shared: `src/lib/brand.ts` (public palette), `src/lib/categories.ts`
  (category shape, helpers and the 18 seed categories), `src/components/`.
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
- The admin's shop list shows the active statuses by default
  (`ACTIVE_STATUSES` in `src/lib/domain.ts`); `rejected` and `unreachable`
  sit in a muted "Архив" group of chips and appear when chosen or when
  searching by domain. Hidden, never deleted.
- `ai_confirmed` is a machine verdict (≥0.8 confidence); `confirmed` has crawler
  evidence or a human behind it. Never merge them in queries or UI.
- Three independent booleans: `shops.voucher_url_verified` (human confirmed the
  landing page), `voucher_offers.verified_by_human` (human confirmed the shop
  sells vouchers), `shops.published` (staged for the public site).
- `voucher_products.source`: `og` / `jsonld` are structured and reliable,
  `text` was regex-scraped and needs a glance, `manual` is a human-pasted URL
  with no price fetched yet (older rows only: the admin no longer adds
  products). It is a filter in the shop list.
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
- Editorial fields (`name`, `description`, `voucher_description`,
  `logo_url`, `category`, `subcategory`, `gift_appeal`, and "Къде се ползва",
  which writes `local_only` + `city`) autosave one at a
  time via `src/actions/editorial.ts`. `description` is the short shop text
  on the cards (clamped to 4 lines); `voucher_description` (`sql/008`) is the
  voucher text, shown whole on the shop page. It uses a small format
  (`src/lib/rich-text.ts`: `**bold**`, `*italic*`, "- " and "1. " lists,
  blank line = paragraph). The admin edits it in a visual editor (Tiptap,
  `shops/_components/rich-text-field.tsx`) whose document is converted to
  and from that format by `src/lib/rich-text-doc.ts`; only the text format
  is stored. It is rendered by `src/components/rich-text.tsx` as React
  elements, never as HTML: keep it that way. Editorial fields save when they
  lose focus (selects at once), not while typing. Both texts are our own copy written from the
  facts, never the merchant's text.
  `category` must be the key of an active category (a select in the form,
  refused otherwise in the action and in the publish gate); `subcategory` is
  free Bulgarian text shown on public cards.
- Categories are data: the `categories` table (`sql/007`), edited in
  `/admin/categories` (`src/actions/categories.ts`): add, rename, recolour,
  change the URL, reorder, delete. `key` is what `shops.category` stores and
  never changes. A changed `path` keeps the old one in `previous_paths`, which
  308s to the new one. Delete is `archived_at` (never `DELETE`), and a category
  with shops can only be deleted by moving them to another one. A colour is
  saved only if ink or white text clears 4.5:1 on it
  (`src/lib/category-input.ts`). The public site shows only active
  categories with at least one published shop (`getVisibleCategories`); an
  empty one has no chip, tile, sitemap entry or page (404). Until `sql/007`
  is run, both sides fall back to the 18 built-in categories.
- Schema changes the admin depends on live in `sql/` and are run by hand in
  the Supabase SQL Editor before deploying; update
  `src/lib/database.types.ts` to match.
- Voucher page verification (`src/actions/products.ts`): one URL, saved as
  `shops.voucher_url` with `voucher_url_verified = true`. It is where the
  site's button goes. The button reads "Купи от …" or "Повече на …"
  (`shops.cta_kind`, `sql/010`, `src/lib/cta.ts`), a select under the URL
  saved through `editorial.ts`. Products are the crawler's and read-only
  in the admin: never added, updated or removed there.
- Crawl suggestions (`src/lib/suggestions.ts`, served by
  `/admin/api/shops/[id]/suggestions`): names, logos and covers read from
  `voucher_products.meta` / `links` / `image_url` and `voucher_offers.raw_extract`.
  Shown next to the editorial fields with a one-click "Използвай"; never
  written automatically.
- Logos and covers (`shops.logo_url`, `shops.cover_url`) always point at our
  own copy in the `shop-media` storage bucket (`src/actions/media.ts`: upload,
  copy from URL, clear). Never store a merchant image URL. Images are
  identified by their bytes (`src/lib/images.ts`); SVG is refused; remote
  fetches only to public hosts, every redirect re-checked, 2 MB / 10 s caps.
- Voucher facts are editable (`src/actions/offers.ts`, one field per save,
  amounts entered and stored in EUR). Every save stamps
  `voucher_offers.human_edited_at`; the pipeline must not overwrite such rows.
- Products (`voucher_products`) are the crawler's: the admin no longer lists
  them. Amounts everywhere (list column, shop page, cards) come from the
  offer's "Номинали"; products only feed crawl suggestions, the source
  filter, the ops counts and `/out`'s fallback link.
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
  The public site's amounts are the preferred offer's denominations (the
  admin's "Номинали"), never product prices: the cards read them in euros
  from `shop_voucher_range` (`min_eur`, `max_eur`, `denominations_eur`,
  same rule, `sql/009`), the shop page from the offer itself.

- Public design: colours only via `brand-*` Tailwind tokens and
  `src/lib/categories.ts`; a hex code in a component is a bug. Fonts:
  Unbounded (`font-display`), Manrope (`font-ui`), IBM Plex Mono
  (`font-num`, all amounts, counts and dates), self-hosted as woff2 in
  `src/lib/fonts/` (Latin + Cyrillic, see its README): the build fetches no
  fonts, so never switch back to `next/font/google`.
  2px `brand-ink` borders; amber only for selected state and the primary
  CTA. `npm test` checks the seed categories and every text token clear
  4.5:1; categories added in the admin are checked when saved.
- Public 404s and redirects for a route with `loading.tsx` are decided in
  that route's `layout.tsx` (see `magazin/[slug]`, `kategoriya/[path]`):
  once the page streams behind the skeleton, the 200 status is already
  sent, so `notFound()` or `redirect()` in the page reaches crawlers as a
  200.

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
