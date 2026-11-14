import { MapPin, X } from "lucide-react";
import Link from "next/link";

import { onColorHex, type Category } from "@/lib/categories";
import { CITIES, findCity, type CityKey } from "@/lib/cities";
import { cn } from "@/lib/utils";

import {
  AMOUNT_BUCKETS,
  DEFAULT_FILTERS,
  DELIVERY,
  browseHref,
  toggled,
  toggledCategory,
  type AmountKey,
  type BrowseFilters,
} from "../_lib/browse-params";
import type { VisibleCity } from "../_lib/categories";

import { FilterButton } from "./filter-button";

// 44px hit area around 34–36px chips (touch target without changing the look).
const chipHit = "relative before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']";
const chipBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-[18px] border-2 border-brand-ink px-3.5 font-ui text-[13.5px] font-extrabold";
const amountBase =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-[18px] border-2 border-brand-ink px-3.5 font-num text-[12.5px] font-semibold text-brand-ink";

const AMOUNT_ORDER: AmountKey[] = AMOUNT_BUCKETS.map((b) => b.key);

// Every choice adds to or removes from its filter; "Всички" / "Всяка" clear it.
function toggleCategory(filters: BrowseFilters, category: Category) {
  return browseHref(filters, { kategorii: toggledCategory(filters.kategorii, category) });
}

function toggleAmount(filters: BrowseFilters, key: AmountKey) {
  return browseHref(filters, { suma: toggled(filters.suma, key, AMOUNT_ORDER) });
}

const CITY_ORDER: CityKey[] = CITIES.map((c) => c.key);
function toggleCity(filters: BrowseFilters, key: CityKey) {
  return browseHref(filters, { grad: toggled(filters.grad, key, CITY_ORDER) });
}

// A city with fewer published shops than this goes under "Още … града", so
// the rail lists only places where there is a real choice.
const MIN_CITY_SHOPS = 8;
function splitCities(cities: VisibleCity[], chosen: readonly CityKey[]) {
  let shown = cities.filter((c) => c.count >= MIN_CITY_SHOPS);
  // Early on no city may reach the bar: show the biggest few anyway.
  if (!shown.length) shown = cities.slice(0, 4);
  // A chosen city always stays in view.
  shown = cities.filter((c) => shown.includes(c) || chosen.includes(c.key));
  return { shown, more: cities.filter((c) => !shown.includes(c)) };
}

const isSelected = (filters: BrowseFilters, category: Category) => filters.kategorii.some((c) => c.key === category.key);

// Mobile: two horizontally scrolling chip rows (Main / Filtered artboards).
export function ChipRows({
  filters,
  categories,
  cities,
}: {
  filters: BrowseFilters;
  // Categories with published shops, biggest first.
  categories: Category[];
  // Cities with published local shops, most first.
  cities: VisibleCity[];
}) {
  return (
    <div className="space-y-2.5 lg:hidden">
      <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterButton
          href={browseHref(filters, { kategorii: [] })}
          pressed={!filters.kategorii.length}
          className={cn(chipBase, chipHit, !filters.kategorii.length ? "bg-brand-ink text-brand-card" : "bg-brand-card text-brand-ink")}
        >
          Всички
        </FilterButton>
        {categories.map((c) => {
          const selected = isSelected(filters, c);
          return (
            <FilterButton
              key={c.key}
              href={toggleCategory(filters, c)}
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
          href={browseHref(filters, { suma: [] })}
          pressed={!filters.suma.length}
          className={cn(amountBase, chipHit, !filters.suma.length ? "bg-brand-amber" : "bg-brand-card")}
        >
          Всяка сума
        </FilterButton>
        {AMOUNT_BUCKETS.map((b) => {
          const selected = filters.suma.includes(b.key);
          return (
            <FilterButton
              key={b.key}
              href={toggleAmount(filters, b.key)}
              pressed={selected}
              className={cn(amountBase, chipHit, selected ? "bg-brand-amber" : "bg-brand-card")}
            >
              {b.label}
              {selected ? <X className="size-3.5" aria-label="махни" /> : null}
            </FilterButton>
          );
        })}
      </div>
      {cities.length ? (
        <div>
          <p className="flex items-center gap-1.5 font-ui text-[13px] font-bold text-brand-ink">
            <MapPin className="size-4" aria-hidden />
            За конкретен град
          </p>
          <div className="-mx-4 mt-1.5 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {cities.map((c) => {
              const selected = filters.grad.includes(c.key);
              return (
                <FilterButton
                  key={c.key}
                  href={toggleCity(filters, c.key)}
                  pressed={selected}
                  className={cn(chipBase, chipHit, selected ? "bg-brand-ink text-brand-card" : "bg-brand-card text-brand-ink")}
                >
                  {c.label}
                  {selected ? <X className="size-3.5" aria-label="махни" /> : null}
                </FilterButton>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const RAIL_CATEGORIES = 7;

// Desktop: the 272px filter rail (Desktop artboard).
export function FilterRail({
  filters,
  counts,
  total,
  categories,
  cities,
}: {
  filters: BrowseFilters;
  counts: Record<string, number>;
  total: number;
  // Categories with published shops, biggest first.
  categories: Category[];
  // Cities with published local shops, most first.
  cities: VisibleCity[];
}) {
  const { shown: shownCities, more: moreCities } = splitCities(cities, filters.grad);
  const cityRow = (c: VisibleCity) => {
    const selected = filters.grad.includes(c.key);
    return (
      <FilterButton
        key={c.key}
        href={toggleCity(filters, c.key)}
        pressed={selected}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px]",
          selected ? "bg-brand-ink font-bold text-brand-card" : "font-semibold text-brand-ink hover:bg-brand-card"
        )}
      >
        {c.label}
        <span className={cn("ml-auto font-num text-[11.5px]", selected ? "opacity-80" : "text-brand-quiet")}>
          {c.count.toLocaleString("bg-BG")}
        </span>
      </FilterButton>
    );
  };
  const visible = categories.slice(0, RAIL_CATEGORIES);
  // Chosen categories stay in view even when they are not among the biggest.
  for (const chosen of filters.kategorii) if (!visible.some((c) => c.key === chosen.key)) visible.push(chosen);
  const hidden = categories.length - visible.length;

  return (
    <aside className="hidden w-[272px] shrink-0 border-r-2 border-brand-ink px-6 py-[26px] lg:block" aria-label="Филтри">
      <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Категории</h2>
      <div className="mt-3 flex flex-col gap-0.5">
        <FilterButton
          href={browseHref(filters, { kategorii: [] })}
          pressed={!filters.kategorii.length}
          className={cn(
            "flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px]",
            !filters.kategorii.length ? "bg-brand-ink font-bold text-brand-card" : "font-semibold text-brand-ink hover:bg-brand-card"
          )}
        >
          Всички
          <span className="ml-auto font-num text-[11.5px] opacity-80">{total.toLocaleString("bg-BG")}</span>
        </FilterButton>
        {visible.map((c) => {
          const selected = isSelected(filters, c);
          return (
            <FilterButton
              key={c.key}
              href={toggleCategory(filters, c)}
              pressed={selected}
              className={cn(
                "flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px]",
                selected ? "bg-brand-ink font-bold text-brand-card" : "font-semibold text-brand-ink hover:bg-brand-card"
              )}
            >
              <span aria-hidden className="size-[11px] shrink-0 rounded-[3px] border-[1.5px] border-brand-ink" style={{ backgroundColor: c.bg }} />
              {c.label}
              <span className={cn("ml-auto font-num text-[11.5px]", selected ? "opacity-80" : "text-brand-quiet")}>
                {(counts[c.key] ?? 0).toLocaleString("bg-BG")}
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
          href={browseHref(filters, { suma: [] })}
          pressed={!filters.suma.length}
          className={cn(amountBase, !filters.suma.length ? "bg-brand-amber" : "bg-brand-card")}
        >
          Всяка
        </FilterButton>
        {AMOUNT_BUCKETS.map((b) => {
          const selected = filters.suma.includes(b.key);
          return (
            <FilterButton
              key={b.key}
              href={toggleAmount(filters, b.key)}
              pressed={selected}
              className={cn(amountBase, selected ? "bg-brand-amber" : "bg-brand-card")}
            >
              {b.label}
            </FilterButton>
          );
        })}
      </div>

      {cities.length ? (
        <>
          <hr className="my-5 border-t-2 border-brand-hair" />
          <h2 className="flex items-center gap-1.5 font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">
            <MapPin className="size-4" aria-hidden />
            За конкретен град
          </h2>
          <div className="mt-3 flex flex-col gap-0.5">{shownCities.map(cityRow)}</div>
          {moreCities.length ? (
            <details className="group mt-1">
              <summary className="cursor-pointer list-none px-3 py-2 text-[13px] font-bold text-brand-mint-deep hover:underline">
                Още {moreCities.length} {moreCities.length === 1 ? "град" : "града"} <span className="group-open:hidden">→</span>
              </summary>
              <div className="flex flex-col gap-0.5">{moreCities.map(cityRow)}</div>
            </details>
          ) : null}
          <p className="mt-2 text-[12px] leading-snug text-brand-quiet">Само магазините, които се ползват на място в града.</p>
        </>
      ) : null}

      <hr className="my-5 border-t-2 border-brand-hair" />
      <h2 className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink">Получаване</h2>
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

const activeChip =
  "inline-flex h-9 items-center gap-1.5 rounded-[18px] border-2 border-brand-ink pl-3.5 pr-2.5 font-ui text-[13px] font-extrabold hover:opacity-90";

// Above the list: every choice in effect, each removable on its own, and one
// link that clears them all. Plain links: the URL is the state.
export function ActiveFilters({ filters }: { filters: BrowseFilters }) {
  const chips: { key: string; label: string; href: string; className: string; style?: React.CSSProperties }[] = [
    ...filters.kategorii.map((c) => ({
      key: `k-${c.key}`,
      label: c.label,
      href: toggleCategory(filters, c),
      className: "",
      style: { backgroundColor: c.bg, color: onColorHex(c.on) },
    })),
    ...AMOUNT_BUCKETS.filter((b) => filters.suma.includes(b.key)).map((b) => ({
      key: `s-${b.key}`,
      label: b.key === "po-izbor" ? "Сума по избор" : b.label,
      href: toggleAmount(filters, b.key),
      className: "bg-brand-amber text-brand-ink",
    })),
    ...filters.grad.map((key) => ({
      key: `g-${key}`,
      label: findCity(key)?.label ?? key,
      href: toggleCity(filters, key),
      className: "bg-brand-ink text-brand-card",
    })),
    ...DELIVERY.filter((d) => filters.dostavka.includes(d.key)).map((d) => ({
      key: `d-${d.key}`,
      label: d.label,
      href: browseHref(filters, { dostavka: filters.dostavka.filter((x) => x !== d.key) }),
      className: "bg-brand-card text-brand-ink",
    })),
  ];
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Избрани филтри">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} scroll={false} className={cn(activeChip, chip.className)} style={chip.style}>
          {chip.label}
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">(махни)</span>
        </Link>
      ))}
      <Link
        href={browseHref(DEFAULT_FILTERS, { podredba: filters.podredba })}
        scroll={false}
        className="ml-1 flex min-h-9 items-center px-1 text-[13px] font-bold text-brand-mint-deep hover:underline"
      >
        Изчисти филтрите
      </Link>
    </div>
  );
}
