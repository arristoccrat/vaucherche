import { CATEGORIES, isCategoryKey, type CategoryKey } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";

// Browse filters live in the URL, so every view is shareable and the server
// renders it. The category is the path (/kategoriya/spa-i-uelnes), the rest
// are query parameters (?suma=50-100&dostavka=digital…).

export const AMOUNT_BUCKETS = [
  { key: "0-25", label: "до 25 €", lo: 0, hi: 25 },
  { key: "25-50", label: "25–50 €", lo: 25, hi: 50 },
  { key: "50-100", label: "50–100 €", lo: 50, hi: 100 },
  { key: "100+", label: "100+ €", lo: 100, hi: null },
] as const;
export type AmountKey = (typeof AMOUNT_BUCKETS)[number]["key"];

export const DELIVERY = [
  { key: "digital", label: "Дигитален (имейл)" },
  { key: "physical", label: "Физическа карта" },
] as const;
export type DeliveryKey = (typeof DELIVERY)[number]["key"];

export const SORTS = [
  { key: "preporachani", label: "Препоръчани" },
  { key: "cena", label: "Най-ниска сума" },
  { key: "ime", label: "Име А–Я" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export type BrowseFilters = {
  kategoriya: CategoryKey | null;
  suma: AmountKey | null;
  dostavka: DeliveryKey[];
  podredba: SortKey;
  stranitsa: number;
};

export const DEFAULT_FILTERS: BrowseFilters = {
  kategoriya: null,
  suma: null,
  dostavka: [],
  podredba: "preporachani",
  stranitsa: 1,
};

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export function parseBrowseFilters(params: Raw): BrowseFilters {
  const kategoriya = first(params.kategoriya);
  // "+" may arrive decoded as a space.
  const suma = first(params.suma).replace(/ $/, "+");
  const dostavka = first(params.dostavka)
    .split(",")
    .filter((d): d is DeliveryKey => DELIVERY.some((x) => x.key === d));
  const podredba = first(params.podredba);
  const stranitsa = Number.parseInt(first(params.stranitsa) || "1", 10);

  return {
    kategoriya: isCategoryKey(kategoriya) ? kategoriya : null,
    suma: AMOUNT_BUCKETS.some((b) => b.key === suma) ? (suma as AmountKey) : null,
    dostavka: Array.from(new Set(dostavka)),
    podredba: SORTS.some((s) => s.key === podredba) ? (podredba as SortKey) : "preporachani",
    stranitsa: Number.isFinite(stranitsa) && stranitsa > 0 ? stranitsa : 1,
  };
}

export function browsePath(kategoriya: CategoryKey | null) {
  return kategoriya ? `/kategoriya/${CATEGORIES[kategoriya].path}` : "/";
}

export function browseHref(filters: BrowseFilters, changes: Partial<BrowseFilters> = {}) {
  const next = { ...filters, ...changes, stranitsa: changes.stranitsa ?? 1 };
  const params = new URLSearchParams();
  if (next.suma) params.set("suma", next.suma);
  if (next.dostavka.length) params.set("dostavka", next.dostavka.join(","));
  if (next.podredba !== DEFAULT_FILTERS.podredba) params.set("podredba", next.podredba);
  if (next.stranitsa > 1) params.set("stranitsa", String(next.stranitsa));
  const query = params.toString();
  const path = browsePath(next.kategoriya);
  return query ? `${path}?${query}` : path;
}

// Search engines index the category and page only; amount, delivery and sort
// variants point back at it. Absolute, because Next drops the query from a
// relative "/?…" canonical.
export function canonicalBrowseUrl(filters: BrowseFilters) {
  const url = new URL(browsePath(filters.kategoriya), SITE_URL);
  if (filters.stranitsa > 1) url.searchParams.set("stranitsa", String(filters.stranitsa));
  return url.toString();
}

export function hasActiveFilters(filters: BrowseFilters) {
  return Boolean(filters.kategoriya || filters.suma || filters.dostavka.length);
}

export function shopCountLabel(n: number) {
  const formatted = n.toLocaleString("bg-BG");
  return `${formatted} ${n === 1 ? "магазин" : "магазина"}`;
}
