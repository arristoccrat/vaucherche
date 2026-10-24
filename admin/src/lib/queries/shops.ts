import "server-only";

import { unstable_cache } from "next/cache";

import { requireUser } from "@/lib/auth";
import { GIFT_APPEALS, SHOP_STATUSES, type ShopStatus } from "@/lib/domain";
import type { ShopFilters } from "@/lib/search-params";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const SHOPS_PAGE_SIZE = 50;

// One round trip: shops plus their offer summary and product prices.
// `source_match` is a second embed of voucher_products used only to filter by
// product source without narrowing the `voucher_products` list itself.
const LIST_SELECT = `
  id, domain, name, slug, status, status_reason, category, subcategory,
  gift_appeal, confidence, published, voucher_url, voucher_url_verified,
  updated_at,
  voucher_offers ( denominations, currency, min_value, max_value,
    custom_amount, is_digital, is_physical, validity_months, verified_by_human ),
  voucher_products ( id, url, price, currency, price_bgn, availability, source ),
  source_match:voucher_products ( source )
`;

export type ListShopsParams = Omit<ShopFilters, "page"> & {
  page: number;
  pageSize?: number;
};

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function buildListQuery(params: ListShopsParams) {
  const supabase = createClient();
  let query = supabase.from("shops").select(LIST_SELECT, { count: "exact" });

  if (params.status.length) query = query.in("status", params.status);
  if (params.category) query = query.eq("category", params.category);
  if (params.giftAppeal) query = query.eq("gift_appeal", params.giftAppeal);
  if (params.published === "yes") query = query.eq("published", true);
  if (params.published === "no") query = query.not("published", "is", true);
  if (params.urlVerified === "yes") query = query.eq("voucher_url_verified", true);
  if (params.urlVerified === "no")
    query = query.not("voucher_url_verified", "is", true);
  if (params.search)
    query = query.ilike("domain", `%${escapeLike(params.search)}%`);
  if (params.source)
    query = query
      .eq("source_match.source", params.source)
      .not("source_match", "is", null);

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
  { revalidate: 60, tags: ["shops"] }
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
  { revalidate: 600, tags: ["shops"] }
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
