import "server-only";

import { unstable_cache } from "next/cache";

import { requireUser } from "@/lib/auth";
import { GIFT_APPEALS, SHOP_STATUSES, type ShopStatus } from "@/lib/domain";
import type { ShopFilters } from "@/lib/search-params";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const SHOPS_PAGE_SIZE = 50;

// Status changes invalidate counts; category/appeal edits invalidate facets.
export const SHOP_COUNTS_TAG = "shop-counts";
export const SHOP_FACETS_TAG = "shop-facets";

// One round trip: shops plus their offer summary and product prices.
// `source_match` is a second embed of voucher_products used only to filter by
// product source without narrowing the `voucher_products` list itself.
const LIST_SELECT = `
  id, domain, name, slug, status, status_reason, category, subcategory,
  gift_appeal, confidence, published, voucher_url, voucher_url_verified,
  voucher_url_note, voucher_type, updated_at,
  voucher_offers ( denominations, currency, min_value, max_value,
    custom_amount, is_digital, is_physical, delivery_methods, validity_months,
    personalisable, terms_url, verified_by_human, verified_at ),
  voucher_products ( id, url, title, price, currency, price_bgn, availability,
    source ),
  source_match:voucher_products ( source )
`;

export type ListShopsParams = Omit<ShopFilters, "page"> & {
  page: number;
  pageSize?: number;
};

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (match) => `\\${match}`);
}

// Structural type so the same filters apply to any shops query, whatever it
// selects (the list, or the id-only scan behind bulk actions).
interface FilterableShopsQuery<Self> {
  in(column: "status", values: string[]): Self;
  eq(column: string, value: string | boolean): Self;
  not(column: string, operator: "is", value: boolean | null): Self;
  ilike(column: "domain", pattern: string): Self;
}

export function applyShopFilters<Q extends FilterableShopsQuery<Q>>(
  query: Q,
  filters: Omit<ShopFilters, "page" | "sort">
): Q {
  let q = query;
  if (filters.status.length) q = q.in("status", filters.status);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.giftAppeal) q = q.eq("gift_appeal", filters.giftAppeal);
  if (filters.published === "yes") q = q.eq("published", true);
  if (filters.published === "no") q = q.not("published", "is", true);
  if (filters.urlVerified === "yes") q = q.eq("voucher_url_verified", true);
  if (filters.urlVerified === "no")
    q = q.not("voucher_url_verified", "is", true);
  if (filters.search)
    q = q.ilike("domain", `%${escapeLike(filters.search)}%`);
  // Needs `source_match:voucher_products(source)` in the select.
  if (filters.source)
    q = q
      .eq("source_match.source", filters.source)
      .not("source_match", "is", null);
  return q;
}

function buildListQuery(params: ListShopsParams) {
  const supabase = createClient();
  let query = applyShopFilters(
    supabase.from("shops").select(LIST_SELECT, { count: "exact" }),
    params
  );

  switch (params.sort) {
    case "domain":
      query = query.order("domain");
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false, nullsFirst: false });
      break;
    case "category":
      query = query
        .order("category", { nullsFirst: false })
        .order("domain");
      break;
    default:
      query = query.order("confidence", { ascending: false, nullsFirst: false });
  }

  // Stable tie-break so rows never jump between pages.
  return query.order("id");
}

export async function listShops(params: ListShopsParams) {
  const pageSize = params.pageSize ?? SHOPS_PAGE_SIZE;
  const from = (params.page - 1) * pageSize;
  const started = performance.now();

  const { data, count, error } = await buildListQuery(params).range(
    from,
    from + pageSize - 1
  );

  // Asking for a page past the end: PostgREST answers 416 without a count.
  if (error?.code === "PGRST103") {
    const { count: total, error: countError } = await buildListQuery(
      params
    ).limit(0);
    if (countError) throw new Error(countError.message);
    return {
      rows: [],
      total: total ?? 0,
      page: params.page,
      pageSize,
      durationMs: Math.round(performance.now() - started),
    };
  }
  if (error) throw new Error(error.message);

  return {
    rows: data ?? [],
    total: count ?? 0,
    page: params.page,
    pageSize,
    durationMs: Math.round(performance.now() - started),
  };
}

export type ShopListRow = Awaited<ReturnType<typeof listShops>>["rows"][number];

// Counts and facets are global, change slowly, and are cached for everyone.
// unstable_cache cannot read the session cookie, so these use the admin
// client — always behind requireUser() in the exported wrapper.

const cachedStatusCounts = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const countWhere = async (status: ShopStatus | null) => {
      let query = supabase
        .from("shops")
        .select("id", { count: "exact", head: true });
      if (status) query = query.eq("status", status);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    };

    const [total, ...perStatus] = await Promise.all([
      countWhere(null),
      ...SHOP_STATUSES.map(countWhere),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(
        SHOP_STATUSES.map((status, i) => [status, perStatus[i]])
      ) as Record<ShopStatus, number>,
    };
  },
  ["shop-status-counts"],
  { revalidate: 60, tags: [SHOP_COUNTS_TAG] }
);

export async function getStatusCounts() {
  await requireUser();
  try {
    return await cachedStatusCounts();
  } catch {
    return null;
  }
}

const FACET_PAGE = 1000;
const FACET_MAX_PAGES = 30;

// PostgREST has no DISTINCT, so read the two columns in pages of 1,000 (the
// API's row cap) and aggregate here. Cached for 10 minutes.
const cachedShopFacets = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const categories = new Map<string, number>();
    const appeals = new Map<string, number>();

    for (let page = 0; page < FACET_MAX_PAGES; page++) {
      const from = page * FACET_PAGE;
      const { data, error } = await supabase
        .from("shops")
        .select("id, category, gift_appeal")
        .or("category.not.is.null,gift_appeal.not.is.null")
        .order("id")
        .range(from, from + FACET_PAGE - 1);
      if (error) throw new Error(error.message);

      for (const row of data) {
        if (row.category)
          categories.set(row.category, (categories.get(row.category) ?? 0) + 1);
        if (row.gift_appeal)
          appeals.set(row.gift_appeal, (appeals.get(row.gift_appeal) ?? 0) + 1);
      }
      if (data.length < FACET_PAGE) break;
    }

    const knownOrder = (value: string) => {
      const i = GIFT_APPEALS.indexOf(value as (typeof GIFT_APPEALS)[number]);
      return i === -1 ? GIFT_APPEALS.length : i;
    };

    return {
      categories: Array.from(categories, ([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
      giftAppeals: Array.from(appeals, ([value, count]) => ({ value, count }))
        .sort((a, b) => knownOrder(a.value) - knownOrder(b.value) ||
          a.value.localeCompare(b.value)),
    };
  },
  ["shop-facets"],
  { revalidate: 600, tags: [SHOP_FACETS_TAG] }
);

export type ShopFacets = Awaited<ReturnType<typeof cachedShopFacets>>;

export async function getShopFacets(): Promise<ShopFacets> {
  await requireUser();
  try {
    return await cachedShopFacets();
  } catch {
    return { categories: [], giftAppeals: [] };
  }
}

const ID_SCAN_PAGE = 1000;
// Upper bound for "select all matching this filter", so one click can never
// run a serverless function past its time limit.
export const MAX_BULK_ROWS = 5000;

export type ShopTarget = {
  id: string;
  status: string;
  status_reason: string | null;
};

// Every shop matching the filters, read in pages of 1,000 (the API row cap).
// Uses the admin client: call only from a Server Action that checked the user.
export async function resolveShopTargets(
  filters: Omit<ShopFilters, "page" | "sort">
): Promise<ShopTarget[] | { tooMany: number }> {
  const supabase = createAdminClient();
  const rows: ShopTarget[] = [];

  for (let from = 0; ; from += ID_SCAN_PAGE) {
    const { data, count, error } = await applyShopFilters(
      supabase
        .from("shops")
        .select("id, status, status_reason, source_match:voucher_products(source)", {
          count: from === 0 ? "exact" : undefined,
        }),
      filters
    )
      .order("id")
      .range(from, from + ID_SCAN_PAGE - 1);
    if (error) throw new Error(error.message);
    if (from === 0 && (count ?? 0) > MAX_BULK_ROWS) return { tooMany: count ?? 0 };

    rows.push(
      ...data.map(({ id, status, status_reason }) => ({ id, status, status_reason }))
    );
    if (data.length < ID_SCAN_PAGE) break;
  }

  return rows;
}
