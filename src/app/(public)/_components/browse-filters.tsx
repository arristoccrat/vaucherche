import { X } from "lucide-react";
import Link from "next/link";

import { CATEGORIES, CATEGORY_KEYS, onColorHex, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/utils";

import { AMOUNT_BUCKETS, DELIVERY, browseHref, type BrowseFilters } from "../_lib/browse-params";

import { FilterButton } from "./filter-button";

// 44px hit area around 34–36px chips (touch target without changing the look).
const chipHit = "relative before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']";
const chipBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-[18px] border-2 border-brand-ink px-3.5 font-ui text-[13.5px] font-extrabold";
const amountBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-[18px] border-2 border-brand-ink px-3.5 font-num text-[12.5px] font-semibold text-brand-ink";

function toggleCategory(filters: BrowseFilters, key: CategoryKey) {
  return browseHref(filters, { kategoriya: filters.kategoriya === key ? null : key });
}

// Mobile: two horizontally scrolling chip rows (Main / Filtered artboards).
export function ChipRows({
  filters,
  categoryOrder,
}: {
  filters: BrowseFilters;
  categoryOrder: CategoryKey[];
}) {
  return (
    <div className="space-y-2.5 lg:hidden">
      <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterButton
          href={browseHref(filters, { kategoriya: null })}
          pressed={!filters.kategoriya}
          className={cn(chipBase, chipHit, !filters.kategoriya ? "bg-brand-ink text-brand-card" : "bg-brand-card text-brand-ink")}
        >
          Всички
        </FilterButton>
        {categoryOrder.map((key) => {
          const c = CATEGORIES[key];
          const selected = filters.kategoriya === key;
          return (
            <FilterButton
              key={key}
              href={toggleCategory(filters, key)}
              pressed={selected}
              className={cn(chipBase, chipHit)}
              style={{ backgroundColor: c.bg, color: onColorHex(c.on) }}
            >
              {c.label}
              {selected ? <X className="size-3.5" aria-label="махни" /> : null}
            </FilterButton>
          );
        })}
      </div>
      <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterButton
          href={browseHref(filters, { suma: null })}
          pressed={!filters.suma}
          className={cn(amountBase, chipHit, !filters.suma ? "bg-brand-amber" : "bg-brand-card")}
        >
          Всяка сума
        </FilterButton>
        {AMOUNT_BUCKETS.map((b) => {
          const selected = filters.suma === b.key;
          return (
            <FilterButton
              key={b.key}
              href={browseHref(filters, { suma: selected ? null : b.key })}
              pressed={selected}
              className={cn(amountBase, chipHit, selected ? "bg-brand-amber" : "bg-brand-card")}
            >
              {b.label}
              {selected ? <X className="size-3.5" aria-label="махни" /> : null}
            </FilterButton>
          );
        })}
      </div>
    </div>
  );
}

const RAIL_CATEGORIES = 7;

// Desktop: the 272px filter rail (Desktop artboard).
export function FilterRail({
  filters,
  counts,
  total,
  categoryOrder,
}: {
  filters: BrowseFilters;
  counts: Record<CategoryKey, number>;
  total: number;
  categoryOrder: CategoryKey[];
}) {
  const visible = categoryOrder.slice(0, RAIL_CATEGORIES);
  if (filters.kategoriya && !visible.includes(filters.kategoriya)) visible.push(filters.kategoriya);
  const hidden = CATEGORY_KEYS.length - visible.length;

  return (
    <aside className="hidden w-[272px] shrink-0 border-r-2 border-brand-ink px-6 py-[26px] lg:block" aria-label="Филтри">
      <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Категории</h2>
      <div className="mt-3 flex flex-col gap-0.5">
        <FilterButton
          href={browseHref(filters, { kategoriya: null })}
          pressed={!filters.kategoriya}
          className={cn(
            "flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px]",
            !filters.kategoriya ? "bg-brand-ink font-bold text-brand-card" : "font-semibold text-brand-ink hover:bg-brand-card"
          )}
        >
          Всички
          <span className="ml-auto font-num text-[11.5px] opacity-80">{total.toLocaleString("bg-BG")}</span>
        </FilterButton>
        {visible.map((key) => {
          const c = CATEGORIES[key];
          const selected = filters.kategoriya === key;
          return (
            <FilterButton
              key={key}
              href={toggleCategory(filters, key)}
              pressed={selected}
              className={cn(
                "flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px]",
                selected ? "bg-brand-ink font-bold text-brand-card" : "font-semibold text-brand-ink hover:bg-brand-card"
              )}
            >
              <span aria-hidden className="size-[11px] shrink-0 rounded-[3px] border-[1.5px] border-brand-ink" style={{ backgroundColor: c.bg }} />
              {c.label}
              <span className={cn("ml-auto font-num text-[11.5px]", selected ? "opacity-80" : "text-brand-quiet")}>
                {counts[key].toLocaleString("bg-BG")}
              </span>
            </FilterButton>
          );
        })}
      </div>
      {hidden > 0 ? (
        <Link href="/kategorii" className="mt-2 inline-block px-3 py-2 text-[13px] font-bold text-brand-mint-deep hover:underline">
          Още {hidden} категории →
        </Link>
      ) : null}

      <hr className="my-5 border-t-2 border-brand-hair" />
      <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Сума</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterButton
          href={browseHref(filters, { suma: null })}
          pressed={!filters.suma}
          className={cn(amountBase, !filters.suma ? "bg-brand-amber" : "bg-brand-card")}
        >
          Всяка
        </FilterButton>
        {AMOUNT_BUCKETS.map((b) => {
          const selected = filters.suma === b.key;
          return (
            <FilterButton
              key={b.key}
              href={browseHref(filters, { suma: selected ? null : b.key })}
              pressed={selected}
              className={cn(amountBase, selected ? "bg-brand-amber" : "bg-brand-card")}
            >
              {b.label}
            </FilterButton>
          );
        })}
      </div>

      <hr className="my-5 border-t-2 border-brand-hair" />
      <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Доставка</h2>
      <div className="mt-3 flex flex-col gap-1">
        {DELIVERY.map((d) => {
          const checked = filters.dostavka.includes(d.key);
          const next = checked ? filters.dostavka.filter((x) => x !== d.key) : [...filters.dostavka, d.key];
          return (
            <FilterButton
              key={d.key}
              href={browseHref(filters, { dostavka: next })}
              pressed={checked}
              className="flex min-h-11 items-center gap-2.5 text-left text-[14px] font-semibold text-brand-ink"
            >
              <span
                aria-hidden
                className={cn("size-[22px] shrink-0 rounded-[6px] border-2 border-brand-ink", checked ? "bg-brand-mint" : "bg-brand-card")}
              />
              {d.label}
            </FilterButton>
          );
        })}
      </div>
    </aside>
  );
}
