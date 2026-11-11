import { findCategory, type Category } from "@/lib/categories";
import { DELIVERY_WORDS } from "@/lib/offer-fields";
import { SITE_URL } from "@/lib/site";

// Browse filters live in the URL, so every view is shareable and the server
// renders it. The category is the path (/kategoriya/spa-i-uelnes), the rest
// are query parameters (?suma=50-100&dostavka=digital…).

export const AMOUNT_BUCKETS = [
  { key: "0-25", label: "до 25 €", lo: 0, hi: 25 },
  { key: "25-50", label: "25–50 €", lo: 25, hi: 50 },
  { key: "50-100", label: "50–100 €", lo: 50, hi: 100 },
  { key: "100+", label: "100+ €", lo: 100, hi: null },
  // Not a range: shops that let the buyer choose the amount ("Сума по избор").
  { key: "po-izbor", label: "По избор", lo: null, hi: null },
] as const;
export type AmountKey = (typeof AMOUNT_BUCKETS)[number]["key"];

// How the voucher reaches the buyer, from the admin's "Получаване"
// (voucher_offers.delivery_methods). The keys are the stored ones.
export const DELIVERY = [
  { key: "digital", label: "Дигитален" },
  { key: "delivery", label: "Физически с доставка" },
  { key: "in_store", label: "В магазин" },
] as const;
export type DeliveryKey = (typeof DELIVERY)[number]["key"];

// The PostgREST `or` filter for the chosen ways: any of them matches. A
// digital voucher also counts when only "Дигитален" (is_digital) is set.
// Words with spaces stay out: they would need quoting inside the filter.
export function deliveryFilter(keys: readonly DeliveryKey[]): string | null {
  if (!keys.length) return null;
  const words = Array.from(new Set(keys.flatMap((k) => DELIVERY_WORDS[k]))).filter((w) => !/[\s,{}"()]/.test(w));
  const parts = [`delivery_methods.ov.{${words.join(",")}}`];
  if (keys.includes("digital")) parts.push("is_digital.eq.true");
  return parts.join(",");
}

export const SORTS = [
  { key: "preporachani", label: "Препоръчани" },
  { key: "cena", label: "Най-ниска сума" },
  { key: "ime", label: "Име А–Я" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export type BrowseFilters = {
  kategoriya: Category | null;
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

// `categories` resolves a legacy ?kategoriya=<key> (the home page redirects
// it to the category's own path); category pages set kategoriya themselves.
export function parseBrowseFilters(params: Raw, categories: readonly Category[] = []): BrowseFilters {
  const kategoriya = first(params.kategoriya);
  // "+" may arrive decoded as a space.
  const suma = first(params.suma).replace(/ $/, "+");
  const dostavka = first(params.dostavka)
    .split(",")
    // "physical" is the old name for a card sent by post.
    .map((d) => (d === "physical" ? "delivery" : d))
    .filter((d): d is DeliveryKey => DELIVERY.some((x) => x.key === d));
  const podredba = first(params.podredba);
  const stranitsa = Number.parseInt(first(params.stranitsa) || "1", 10);

  return {
    kategoriya: findCategory(categories, kategoriya) ?? null,
    suma: AMOUNT_BUCKETS.some((b) => b.key === suma) ? (suma as AmountKey) : null,
    dostavka: Array.from(new Set(dostavka)),
    podredba: SORTS.some((s) => s.key === podredba) ? (podredba as SortKey) : "preporachani",
    stranitsa: Number.isFinite(stranitsa) && stranitsa > 0 ? stranitsa : 1,
  };
}

export function browsePath(kategoriya: Pick<Category, "path"> | null) {
  return kategoriya ? `/kategoriya/${kategoriya.path}` : "/";
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
