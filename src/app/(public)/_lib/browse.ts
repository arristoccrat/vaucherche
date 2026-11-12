import { publicClient } from "@/lib/supabase/public";

import { allOf, amountFilter, deliveryFilter, type BrowseFilters } from "./browse-params";
import { legacySearchFilter, searchFilter } from "./search-query";

export const PAGE_SIZE = 24;

// Everything a card shows; nothing else leaves the database.
const CARD_SELECT =
  "id, slug, name, domain, description, logo_url, cover_url, category, subcategory, min_eur, max_eur, denominations_eur, custom_amount, is_digital, is_physical, validity_months";

type FilterParts = Pick<BrowseFilters, "kategorii" | "suma" | "dostavka">;

// Structural type so the same filters apply to the list and the counts.
interface Filterable<Self> {
  eq(column: string, value: string | boolean): Self;
  in(column: string, values: readonly string[]): Self;
  or(filters: string): Self;
}

function applyFilters<Q extends Filterable<Q>>(query: Q, filters: FilterParts): Q {
  // RLS already hides unpublished shops; the explicit filter is belt and braces.
  let q = query.eq("published", true);
  if (filters.kategorii.length) q = q.in("category", filters.kategorii.map((c) => c.key));
  // Any chosen amount and any chosen way of receiving it.
  const choices = allOf([amountFilter(filters.suma), deliveryFilter(filters.dostavka)]);
  if (choices) q = q.or(choices);
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
  const counts: Record<string, number> = {};
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
      if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
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

// Search results: same cards and order as browse, matched on name, domain,
// subcategory and our description (see search-query.ts).
export async function searchPublishedShops(query: string, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const run = (filter: string) =>
    publicClient()
      .from("shop_voucher_range")
      .select(CARD_SELECT, { count: "exact" })
      .eq("published", true)
      .or(filter)
      .order("gift_appeal_rank", { ascending: true, nullsFirst: false })
      .order("name")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
  let { data, count, error } = await run(searchFilter(query));
  // sql/011 not run yet: no search_text column, so search the old columns.
  if (error && /search_text/.test(error.message)) ({ data, count, error } = await run(legacySearchFilter(query)));
  if (error?.code === "PGRST103") return { shops: [], total: null };
  if (error) throw new Error(error.message);
  return { shops: data ?? [], total: count ?? 0 };
}
