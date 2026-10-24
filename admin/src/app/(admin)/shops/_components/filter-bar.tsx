"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import {
  GIFT_APPEAL_LABELS,
  PRODUCT_SOURCES,
  isGiftAppeal,
  type ProductSource,
} from "@/lib/domain";
import {
  SHOP_SORTS,
  SHOP_SORT_LABELS,
  shopsHref,
  type ShopFilters,
  type ShopSort,
  type YesNo,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";

type Facet = { value: string; count: number };

const SOURCE_LABELS: Record<ProductSource, string> = {
  og: "og (структурирани)",
  jsonld: "jsonld (структурирани)",
  text: "text (от текста)",
  manual: "manual (ръчно)",
};

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}

// The only client part of the browser: turns control changes into URL changes.
export function FilterBar({
  filters,
  categories,
  giftAppeals,
}: {
  filters: ShopFilters;
  categories: Facet[];
  giftAppeals: Facet[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const lastPushed = useRef(filters.search);

  const go = (changes: Partial<ShopFilters>, replace = false) =>
    startTransition(() => {
      const href = shopsHref(filters, changes);
      if (replace) router.replace(href);
      else router.push(href);
    });

  // Keep the box in sync when the URL changes from elsewhere (back button).
  useEffect(() => {
    setSearch(filters.search);
    lastPushed.current = filters.search;
  }, [filters.search]);

  useEffect(() => {
    const term = search.trim();
    if (term === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = term;
      go({ search: term }, true);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const yesNo = (value: string) => (value === "yes" || value === "no" ? (value as YesNo) : null);

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-muted-foreground">
        Търсене по домейн
        <Input
          type="search"
          value={search}
          placeholder="напр. spa, books…"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <Select
        label="Категория"
        value={filters.category ?? ""}
        onChange={(value) => go({ category: value || null })}
      >
        <option value="">Всички</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.value} ({c.count})
          </option>
        ))}
        {filters.category &&
        !categories.some((c) => c.value === filters.category) ? (
          <option value={filters.category}>{filters.category}</option>
        ) : null}
      </Select>

      <Select
        label="Подаръчна привлекателност"
        value={filters.giftAppeal ?? ""}
        onChange={(value) => go({ giftAppeal: value || null })}
      >
        <option value="">Всички</option>
        {giftAppeals.map((a) => (
          <option key={a.value} value={a.value}>
            {isGiftAppeal(a.value) ? GIFT_APPEAL_LABELS[a.value] : a.value} ({a.count})
          </option>
        ))}
        {filters.giftAppeal &&
        !giftAppeals.some((a) => a.value === filters.giftAppeal) ? (
          <option value={filters.giftAppeal}>{filters.giftAppeal}</option>
        ) : null}
      </Select>

      <Select
        label="Публикуван"
        value={filters.published ?? ""}
        onChange={(value) => go({ published: yesNo(value) })}
      >
        <option value="">Всички</option>
        <option value="yes">Да</option>
        <option value="no">Не</option>
      </Select>

      <Select
        label="URL потвърден"
        value={filters.urlVerified ?? ""}
        onChange={(value) => go({ urlVerified: yesNo(value) })}
      >
        <option value="">Всички</option>
        <option value="yes">Да</option>
        <option value="no">Не</option>
      </Select>

      <Select
        label="Източник на цена"
        value={filters.source ?? ""}
        onChange={(value) =>
          go({
            source: PRODUCT_SOURCES.includes(value as ProductSource)
              ? (value as ProductSource)
              : null,
          })
        }
      >
        <option value="">Всички</option>
        {PRODUCT_SOURCES.map((source) => (
          <option key={source} value={source}>
            {SOURCE_LABELS[source]}
          </option>
        ))}
      </Select>

      <Select
        label="Подредба"
        value={filters.sort}
        onChange={(value) =>
          go({
            sort: SHOP_SORTS.includes(value as ShopSort)
              ? (value as ShopSort)
              : "confidence",
          })
        }
      >
        {SHOP_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SHOP_SORT_LABELS[sort]}
          </option>
        ))}
      </Select>
    </div>
  );
}
