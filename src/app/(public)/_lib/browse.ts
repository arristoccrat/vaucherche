import { CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { publicClient } from "@/lib/supabase/public";

import { AMOUNT_BUCKETS, type BrowseFilters } from "./browse-params";

export const PAGE_SIZE = 24;

// Everything a card shows; nothing else leaves the database.
const CARD_SELECT =
  "id, slug, name, domain, description, logo_url, cover_url, category, subcategory, min_eur, max_eur, denominations_eur, custom_amount, is_digital, is_physical, validity_months";

type FilterParts = Pick<BrowseFilters, "kategoriya" | "suma" | "dostavka">;

// Structural type so the same filters apply to the list and the counts.
interface Filterable<Self> {
  eq(column: string, value: string | boolean): Self;
  lte(column: string, value: number): Self;
  gte(column: string, value: number): Self;
  or(filters: string): Self;
}

function applyFilters<Q extends Filterable<Q>>(query: Q, filters: FilterParts): Q {
  // RLS already hides unpublished shops; the explicit filter is belt and braces.
  let q = query.eq("published", true);
  if (filters.kategoriya) q = q.eq("category", filters.kategoriya);
  const bucket = AMOUNT_BUCKETS.find((b) => b.key === filters.suma);
  if (bucket) {
    // Shops whose euro range overlaps the bucket; shops without prices drop out.
    q = q.gte("max_eur", bucket.lo);
    if (bucket.hi !== null) q = q.lte("min_eur", bucket.hi);
  }
  if (filters.dostavka.length) {
    q = q.or(filters.dostavka.map((d) => (d === "digital" ? "is_digital.eq.true" : "is_physical.eq.true")).join(","));
  }
  return q;
}

export async function listPublishedShops(filters: BrowseFilters) {
  const from = (filters.stranitsa - 1) * PAGE_SIZE;
  let query = applyFilters(
    publicClient().from("shop_voucher_range").select(CARD_SELECT, { count: "exact" }),
    filters
  );
  switch (filters.podredba) {
    case "cena":
      query = query.order("min_eur", { ascending: true, nullsFirst: false });
      break;
    case "ime":
      query = query.order("name");
      break;
    default:
      // gift_appeal high → medium → low → none (generated rank, sql/006).
      query = query.order("gift_appeal_rank", { ascending: true, nullsFirst: false }).order("name");
  }
  const { data, count, error } = await query.order("id").range(from, from + PAGE_SIZE - 1);

  if (error?.code === "PGRST103") {
    // Page past the end: report the real total so the page can link back.
    return { shops: [], total: await countPublishedShops(filters) };
  }
  if (error) throw new Error(error.message);
  return { shops: data ?? [], total: count ?? 0 };
}

export type CardShop = Awaited<ReturnType<typeof listPublishedShops>>["shops"][number];

export async function countPublishedShops(filters: FilterParts) {
  const { count, error } = await applyFilters(
    publicClient().from("shop_voucher_range").select("id", { count: "exact", head: true }),
    filters
  );
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Published shops per category for the filter rail. Paged in 1,000s (the API
// row cap); cached with every other public read.
export async function categoryCounts() {
  const counts = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<CategoryKey, number>;
  let total = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await publicClient()
      .from("shops")
      .select("category")
      .eq("published", true)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data) {
      total += 1;
      if (row.category && row.category in counts) counts[row.category as CategoryKey] += 1;
    }
    if (data.length < 1000) break;
  }
  return { counts, total };
}

// Every published shop's slug and last update, for the sitemap. Paged in
// 1,000s like categoryCounts.
export async function publishedShopSlugs() {
  const rows: { slug: string; updated_at: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await publicClient()
      .from("shops")
      .select("slug, updated_at")
      .eq("published", true)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}
