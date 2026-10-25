import Link from "next/link";

import { ShopCard } from "@/components/shop-card";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { cn } from "@/lib/utils";

import { PAGE_SIZE, categoryCounts, listPublishedShops } from "../_lib/browse";
import { DEFAULT_FILTERS, SORTS, browseHref, hasActiveFilters, shopCountLabel, type BrowseFilters } from "../_lib/browse-params";

import { BrowseEmpty } from "./browse-empty";
import { ChipRows, FilterRail } from "./browse-filters";
import { BrowsePagination } from "./browse-pagination";
import { SortSelect } from "./filter-button";

// The browse list shared by / and /kategoriya/[path]: every filter lives in
// the URL, every read is a cached published-only query.
export async function BrowseView({ filters }: { filters: BrowseFilters }) {
  const [{ shops, total }, { counts, total: published }] = await Promise.all([
    listPublishedShops(filters),
    categoryCounts(),
  ]);
  // Biggest categories first; ties keep the canonical order.
  const categoryOrder = [...CATEGORY_KEYS].sort((a, b) => counts[b] - counts[a]);
  const category = filters.kategoriya ? CATEGORIES[filters.kategoriya] : null;
  // On a category page the category is the page, not a filter: clearing
  // keeps it.
  const filtered = category ? Boolean(filters.suma || filters.dostavka.length) : hasActiveFilters(filters);
  const clearHref = browseHref(
    category ? { ...DEFAULT_FILTERS, kategoriya: filters.kategoriya } : DEFAULT_FILTERS,
    { podredba: filters.podredba }
  );
  const headingCount = filters.kategoriya ? counts[filters.kategoriya] : published;
  const sortOptions = SORTS.map((s) => ({ key: s.key, label: s.label, href: browseHref(filters, { podredba: s.key }) }));

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <FilterRail filters={filters} counts={counts} total={published} categoryOrder={categoryOrder} />

      <div className="min-w-0 flex-1 px-4 pb-10 pt-4 lg:px-9 lg:pt-[26px]">
        {category ? null : (
          <p className="text-[13.5px] font-medium text-brand-body lg:hidden">Подарък, който никога не е сгрешен</p>
        )}
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
          <div>
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-ink lg:text-[30px]">
              {category ? category.label : "Подаръчни ваучери"}
            </h1>
            <p className="mt-1 hidden font-num text-xs font-semibold text-brand-ink lg:block">
              {headingCount.toLocaleString("bg-BG")} {headingCount === 1 ? "български магазин" : "български магазина"} · проверени ръчно
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

        <BrowsePagination
          page={filters.stranitsa}
          total={total}
          pageSize={PAGE_SIZE}
          hrefFor={(stranitsa) => browseHref(filters, { stranitsa })}
        />
      </div>
    </div>
  );
}
