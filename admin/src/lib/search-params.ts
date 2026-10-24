import {
  PRODUCT_SOURCES,
  SHOP_STATUSES,
  type ProductSource,
  type ShopStatus,
} from "@/lib/domain";

// All shops-browser state lives in the URL so every view is shareable,
// bookmarkable and survives a refresh.

export const SHOP_SORTS = ["confidence", "domain", "updated", "category"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];

export const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  confidence: "Увереност ↓",
  domain: "Домейн А–Я",
  updated: "Последно обновени",
  category: "Категория",
};

export type YesNo = "yes" | "no";

export type ShopFilters = {
  status: ShopStatus[];
  category: string | null;
  giftAppeal: string | null;
  published: YesNo | null;
  urlVerified: YesNo | null;
  search: string;
  source: ProductSource | null;
  sort: ShopSort;
  page: number;
};

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  status: [],
  category: null,
  giftAppeal: null,
  published: null,
  urlVerified: null,
  search: "",
  source: null,
  sort: "confidence",
  page: 1,
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || null;
}

function oneOf<T extends string>(
  values: readonly T[],
  value: string | null
): T | null {
  return value && values.includes(value as T) ? (value as T) : null;
}

function shortText(value: string | null, max = 100) {
  return value && value.length <= max ? value : null;
}

export function parseShopFilters(params: RawParams): ShopFilters {
  const statuses = (first(params.status) ?? "")
    .split(",")
    .filter((s): s is ShopStatus => SHOP_STATUSES.includes(s as ShopStatus));
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    status: Array.from(new Set(statuses)),
    category: shortText(first(params.category)),
    giftAppeal: shortText(first(params.appeal)),
    published: oneOf(["yes", "no"] as const, first(params.published)),
    urlVerified: oneOf(["yes", "no"] as const, first(params.verified)),
    search: shortText(first(params.q), 200) ?? "",
    source: oneOf(PRODUCT_SOURCES, first(params.source)),
    sort: oneOf(SHOP_SORTS, first(params.sort)) ?? "confidence",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function serializeShopFilters(filters: ShopFilters) {
  const params = new URLSearchParams();
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.category) params.set("category", filters.category);
  if (filters.giftAppeal) params.set("appeal", filters.giftAppeal);
  if (filters.published) params.set("published", filters.published);
  if (filters.urlVerified) params.set("verified", filters.urlVerified);
  if (filters.search) params.set("q", filters.search);
  if (filters.source) params.set("source", filters.source);
  if (filters.sort !== DEFAULT_SHOP_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

// Any change other than the page itself sends you back to page 1.
export function shopsHref(filters: ShopFilters, changes: Partial<ShopFilters>) {
  const next: ShopFilters = {
    ...filters,
    ...changes,
    page: changes.page ?? 1,
  };
  const query = serializeShopFilters(next).toString();
  return query ? `/shops?${query}` : "/shops";
}
