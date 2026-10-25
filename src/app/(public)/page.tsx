import Link from "next/link";

import { ShopCard } from "@/components/shop-card";
import { CATEGORY_KEYS } from "@/lib/categories";
import { cn } from "@/lib/utils";

import { BrowseEmpty } from "./_components/browse-empty";
import { ChipRows, FilterRail } from "./_components/browse-filters";
import { BrowsePagination } from "./_components/browse-pagination";
import { SortSelect } from "./_components/filter-button";
import { PAGE_SIZE, categoryCounts, listPublishedShops } from "./_lib/browse";
import {
  DEFAULT_FILTERS,
  SORTS,
  browseHref,
  hasActiveFilters,
  parseBrowseFilters,
  shopCountLabel,
} from "./_lib/browse-params";

// Browse: every filter lives in searchParams, every read is a cached
// published-only query (src/lib/supabase/public.ts).
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseBrowseFilters(searchParams);
  const [{ shops, total }, { counts, total: published }] = await Promise.all([
    listPublishedShops(filters),
    categoryCounts(),
  ]);
  // Biggest categories first; ties keep the canonical order.
  const categoryOrder = [...CATEGORY_KEYS].sort((a, b) => counts[b] - counts[a]);
  const filtered = hasActiveFilters(filters);
  const clearHref = browseHref(DEFAULT_FILTERS, { podredba: filters.podredba });
  const sortOptions = SORTS.map((s) => ({ key: s.key, label: s.label, href: browseHref(filters, { podredba: s.key }) }));

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <FilterRail filters={filters} counts={counts} total={published} categoryOrder={categoryOrder} />

      <div className="min-w-0 flex-1 px-4 pb-10 pt-4 lg:px-9 lg:pt-[26px]">
        <p className="text-[13.5px] font-medium text-brand-body lg:hidden">Подарък, който никога не е сгрешен</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
          <div>
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-ink lg:text-[30px]">
              Подаръчни ваучери
            </h1>
            <p className="mt-1 hidden font-num text-xs font-semibold text-brand-ink lg:block">
              {published.toLocaleString("bg-BG")} {published === 1 ? "български магазин" : "български магазина"} · проверени ръчно
            </p>
          </div>
          <div className="hidden lg:block">
            <SortSelect value={filters.podredba} options={sortOptions} />
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <ChipRows filters={filters} categoryOrder={categoryOrder} />
        </div>

        <div className={cn("mt-4 flex min-h-11 items-center justify-between gap-3 lg:mt-5", !filtered && "lg:hidden")}>
          <p className="font-num text-xs font-semibold text-brand-ink" aria-live="polite">
            {shopCountLabel(total)}
          </p>
          {filtered ? (
            <Link href={clearHref} className="flex min-h-11 items-center text-[13px] font-bold text-brand-mint-deep hover:underline">
              Изчисти филтрите
            </Link>
          ) : (
            <div className="lg:hidden">
              <SortSelect value={filters.podredba} options={sortOptions} />
            </div>
          )}
        </div>

        {shops.length ? (
          <ul className="mt-3 lg:mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 lg:gap-[18px]">
            {shops.map((shop, i) => (
              <li key={shop.id}>
                <ShopCard shop={shop} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : total > 0 ? (
          <p className="mt-6 text-[14px] text-brand-body">
            Тази страница е празна.{" "}
            <Link href={browseHref(filters)} className="font-bold text-brand-mint-deep hover:underline">
              Към първата страница
            </Link>
          </p>
        ) : (
          <div className="mt-3">
            <BrowseEmpty filters={filters} />
          </div>
        )}

        <BrowsePagination filters={filters} total={total} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
