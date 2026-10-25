import type { Metadata } from "next";
import Link from "next/link";

import { ShopCard } from "@/components/shop-card";
import { CATEGORIES, onColorHex } from "@/lib/categories";

import { BrowsePagination } from "../_components/browse-pagination";
import { PAGE_SIZE, searchPublishedShops } from "../_lib/browse";
import { browsePath, shopCountLabel } from "../_lib/browse-params";
import { matchingCategories, normalizeQuery } from "../_lib/search-query";

type Props = { searchParams: Record<string, string | string[] | undefined> };

// Search result pages are not worth indexing; their links are.
export function generateMetadata({ searchParams }: Props): Metadata {
  const query = normalizeQuery(searchParams.q);
  return {
    title: query ? `„${query}“ — търсене | vaucherche` : "Търсене | vaucherche",
    robots: { index: false, follow: true },
  };
}

function searchHref(query: string, page: number) {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("stranitsa", String(page));
  return `/tarsene?${params}`;
}

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/tarsene" method="get" role="search">
      <label className="flex h-[50px] items-center gap-2.5 rounded-[25px] border-2 border-brand-ink bg-brand-card px-4">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="size-[18px] shrink-0">
          <circle cx="11" cy="11" r="7" className="stroke-brand-ink" />
          <path d="M16.5 16.5L21 21" className="stroke-brand-ink" />
        </svg>
        <span className="sr-only">Търси магазин или категория</span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          autoFocus={!query}
          maxLength={100}
          placeholder="Търси магазин или категория…"
          className="w-full bg-transparent font-ui text-[15px] text-brand-ink placeholder:text-brand-quiet focus:outline-none"
        />
      </label>
    </form>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const query = normalizeQuery(searchParams.q);
  const page = Math.max(1, Number.parseInt(String(searchParams.stranitsa ?? "1"), 10) || 1);
  const categories = matchingCategories(query);
  const { shops, total } = query ? await searchPublishedShops(query, page) : { shops: [], total: 0 };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-3 lg:px-10 lg:pt-8">
      {/* From md up the header's search field is visible. */}
      <div className="md:hidden">
        <SearchForm query={query} />
      </div>

      {query ? (
        <>
          <h1 className="mt-6 font-display text-[22px] font-extrabold tracking-[-0.02em] text-brand-ink md:mt-0 lg:text-[28px]">
            Резултати за „{query}“
          </h1>
          <p className="mt-1 font-num text-xs font-semibold text-brand-ink" aria-live="polite">
            {total === null ? "Няма такава страница" : shopCountLabel(total)}
          </p>
        </>
      ) : (
        <h1 className="mt-6 font-display text-[22px] font-extrabold tracking-[-0.02em] text-brand-ink md:mt-0 lg:text-[28px]">
          Какво търсиш?
        </h1>
      )}

      {categories.length ? (
        <div className="mt-4">
          <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Категории</h2>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {categories.map((key) => {
              const c = CATEGORIES[key];
              return (
                <li key={key}>
                  <Link
                    href={browsePath(key)}
                    className="inline-flex h-11 items-center rounded-[22px] border-2 border-brand-ink px-4 font-ui text-[13.5px] font-extrabold"
                    style={{ backgroundColor: c.bg, color: onColorHex(c.on) }}
                  >
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {shops.length ? (
        <ul className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-[18px] xl:grid-cols-3">
          {shops.map((shop, i) => (
            <li key={shop.id}>
              <ShopCard shop={shop} priority={i < 3} />
            </li>
          ))}
        </ul>
      ) : query ? (
        <div className="mt-6 rounded-[18px] border-2 border-dashed border-brand-dashed bg-brand-card px-6 py-10 text-center">
          <h2 className="font-display text-[19px] font-bold tracking-[-0.01em] text-brand-ink">
            {total === null ? "Тази страница е празна" : "Няма магазини с това име"}
          </h2>
          <p className="mt-2 text-[14px] text-brand-body">
            {total === null ? "Резултатите са по-малко." : "Опитай с по-кратка дума или разгледай по повод."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link
              href={total === null ? searchHref(query, 1) : "/kategorii"}
              className="inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-amber px-5 font-ui text-sm font-extrabold text-brand-ink"
            >
              {total === null ? "Към първата страница" : "Всички категории"}
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-brand-body">
          Търси по име на магазин, адрес на сайта или повод — например „масаж“ или „книги“. Или{" "}
          <Link href="/kategorii" className="font-bold text-brand-mint-deep hover:underline">
            разгледай по повод
          </Link>
          .
        </p>
      )}

      {total ? <BrowsePagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(p) => searchHref(query, p)} /> : null}
    </div>
  );
}
