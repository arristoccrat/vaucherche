import { findCategory, type Category } from "@/lib/categories";
import { CITIES, type CityKey } from "@/lib/cities";
import { DELIVERY_WORDS } from "@/lib/offer-fields";
import { SITE_URL } from "@/lib/site";

// Browse filters live in the URL, so every view is shareable and the server
// renders it. One category is the path (/kategoriya/spa-i-uelnes); several
// are a list on the home page (/?kategoriya=sport,beauty). The rest are
// query parameters, each a comma list (?suma=0-25,po-izbor&dostavka=digital…).
// Within a filter any choice matches; filters combine with "and".

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

// The PostgREST `or` filter for the chosen amounts: a shop matches when its
// euro range overlaps any chosen bucket, or (for "По избор") when it sells a
// custom amount. Shops without amounts drop out of the ranges.
export function amountFilter(keys: readonly AmountKey[]): string | null {
  const parts = AMOUNT_BUCKETS.filter((b) => keys.includes(b.key)).map((b) => {
    if (b.key === "po-izbor") return "custom_amount.eq.true";
    return b.hi === null ? `max_eur.gte.${b.lo}` : `and(max_eur.gte.${b.lo},min_eur.lte.${b.hi})`;
  });
  return parts.length ? parts.join(",") : null;
}

// Several `or` groups must all hold: one PostgREST `or` whose single member
// is the `and` of the groups.
export function allOf(groups: readonly (string | null)[]): string | null {
  const present = groups.filter((g): g is string => Boolean(g));
  if (present.length <= 1) return present[0] ?? null;
  return `and(${present.map((g) => `or(${g})`).join(",")})`;
}

export const SORTS = [
  { key: "preporachani", label: "Препоръчани" },
  { key: "cena", label: "Най-ниска сума" },
  { key: "ime", label: "Име А–Я" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export type BrowseFilters = {
  kategorii: Category[];
  suma: AmountKey[];
  dostavka: DeliveryKey[];
  // Only shops tied to one of these cities (sql/012); online ones drop out.
  grad: CityKey[];
  podredba: SortKey;
  stranitsa: number;
};

export const DEFAULT_FILTERS: BrowseFilters = {
  kategorii: [],
  suma: [],
  dostavka: [],
  grad: [],
  podredba: "preporachani",
  stranitsa: 1,
};

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

const list = (v: string | string[] | undefined) =>
  first(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

// `categories` resolves ?kategoriya=<key>,<key> on the home page (a single
// key is redirected to the category's own path); category pages set
// kategorii themselves.
export function parseBrowseFilters(params: Raw, categories: readonly Category[] = []): BrowseFilters {
  const kategorii = list(params.kategoriya)
    .map((key) => findCategory(categories, key))
    .filter((c): c is Category => Boolean(c));
  // "+" may arrive decoded as a space ("100 " for "100+").
  const suma = first(params.suma)
    .replace(/ (?=,|$)/g, "+")
    .split(",")
    .filter((x): x is AmountKey => AMOUNT_BUCKETS.some((b) => b.key === x));
  const dostavka = first(params.dostavka)
    .split(",")
    // "physical" is the old name for a card sent by post.
    .map((d) => (d === "physical" ? "delivery" : d))
    .filter((d): d is DeliveryKey => DELIVERY.some((x) => x.key === d));
  const podredba = first(params.podredba);
  const stranitsa = Number.parseInt(first(params.stranitsa) || "1", 10);

  return {
    kategorii: kategorii.filter((c, i) => kategorii.findIndex((x) => x.key === c.key) === i),
    // In the buckets' order, so a URL has one spelling.
    suma: AMOUNT_BUCKETS.map((b) => b.key).filter((k) => suma.includes(k)),
    dostavka: DELIVERY.map((d) => d.key).filter((k) => dostavka.includes(k)),
    grad: CITIES.map((c) => c.key).filter((k) => list(params.grad).includes(k)),
    podredba: SORTS.some((s) => s.key === podredba) ? (podredba as SortKey) : "preporachani",
    stranitsa: Number.isFinite(stranitsa) && stranitsa > 0 ? stranitsa : 1,
  };
}

export function browsePath(kategoriya: Pick<Category, "path"> | null) {
  return kategoriya ? `/kategoriya/${kategoriya.path}` : "/";
}

// One category has its own page; several are a list on the home page.
function categoriesPath(kategorii: readonly Category[]) {
  return kategorii.length === 1 ? browsePath(kategorii[0]) : "/";
}

export function browseHref(filters: BrowseFilters, changes: Partial<BrowseFilters> = {}) {
  const next = { ...filters, ...changes, stranitsa: changes.stranitsa ?? 1 };
  const params = new URLSearchParams();
  if (next.kategorii.length > 1) params.set("kategoriya", next.kategorii.map((c) => c.key).join(","));
  if (next.suma.length) params.set("suma", next.suma.join(","));
  if (next.dostavka.length) params.set("dostavka", next.dostavka.join(","));
  if (next.grad.length) params.set("grad", next.grad.join(","));
  if (next.podredba !== DEFAULT_FILTERS.podredba) params.set("podredba", next.podredba);
  if (next.stranitsa > 1) params.set("stranitsa", String(next.stranitsa));
  // Commas stay readable in the URL.
  const query = params.toString().replace(/%2C/g, ",");
  const path = categoriesPath(next.kategorii);
  return query ? `${path}?${query}` : path;
}

// Adds the value if it is missing, removes it if present; keeps `order`.
export function toggled<T>(values: readonly T[], value: T, order: readonly T[]): T[] {
  const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  return order.filter((v) => next.includes(v));
}

export function toggledCategory(kategorii: readonly Category[], category: Category): Category[] {
  return kategorii.some((c) => c.key === category.key)
    ? kategorii.filter((c) => c.key !== category.key)
    : [...kategorii, category];
}

// Search engines index the category and page only; amount, delivery, sort
// and multi-category variants point back at it. Absolute, because Next drops
// the query from a relative "/?…" canonical.
export function canonicalBrowseUrl(filters: BrowseFilters) {
  const url = new URL(categoriesPath(filters.kategorii), SITE_URL);
  if (filters.stranitsa > 1) url.searchParams.set("stranitsa", String(filters.stranitsa));
  return url.toString();
}

export function hasActiveFilters(filters: BrowseFilters) {
  return Boolean(filters.kategorii.length || filters.suma.length || filters.dostavka.length || filters.grad.length);
}

// "Спорт", "Спорт и Красота", "Спорт, Красота и Книги".
export function categoriesLabel(kategorii: readonly Pick<Category, "label">[]) {
  const labels = kategorii.map((c) => c.label);
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} и ${labels[labels.length - 1]}` : (labels[0] ?? "");
}

export function shopCountLabel(n: number) {
  const formatted = n.toLocaleString("bg-BG");
  return `${formatted} ${n === 1 ? "магазин" : "магазина"}`;
}
