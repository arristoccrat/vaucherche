import "server-only";

import { unstable_cache } from "next/cache";

import { requireUser } from "@/lib/auth";
import { PRODUCT_SOURCES, type ProductSource } from "@/lib/domain";
import { SHOP_COUNTS_TAG } from "@/lib/queries/shops";
import { createAdminClient } from "@/lib/supabase/admin";

const DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Everything on /ops is a count, read with HEAD requests (no rows move) and
// cached for a minute. Same pattern as the status counts: admin client inside
// the cache, requireUser() in the exported wrapper.
const cachedOpsStats = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - DAY_MS).toISOString();
    const firstDay = startOfUtcDay(new Date(now.getTime() - (DAYS - 1) * DAY_MS));

    const count = async (
      label: string,
      query: PromiseLike<{ count: number | null; error: { message: string } | null }>
    ) => {
      const { count: value, error } = await query;
      if (error) throw new Error(`${label}: ${error.message}`);
      return value ?? 0;
    };

    const shops = () => supabase.from("shops").select("id", { count: "exact", head: true });
    const products = () =>
      supabase.from("voucher_products").select("id", { count: "exact", head: true });
    const fetches = () => supabase.from("fetch_log").select("id", { count: "exact", head: true });

    const days = Array.from({ length: DAYS }, (_, i) => {
      const start = new Date(firstDay.getTime() + i * DAY_MS);
      return { start, end: new Date(start.getTime() + DAY_MS) };
    });

    const [
      published,
      confirmed,
      aiConfirmed,
      noProducts,
      publishedNoPrice,
      productTotal,
      bySource,
      fetches24h,
      errors24h,
      daily,
      lastFetch,
    ] = await Promise.all([
      count("published", shops().eq("published", true)),
      count("confirmed", shops().eq("status", "confirmed")),
      count("ai_confirmed", shops().eq("status", "ai_confirmed")),
      // Product-crawl backlog: confirmed (either kind) with no products at all.
      count(
        "no products",
        supabase
          .from("shops")
          .select("id, voucher_products(id)", { count: "exact", head: true })
          .in("status", ["confirmed", "ai_confirmed"])
          .is("voucher_products", null)
      ),
      // Thin listings: live, but no product with a price.
      count(
        "published without price",
        supabase
          .from("shops")
          .select("id, priced:voucher_products(id)", { count: "exact", head: true })
          .eq("published", true)
          .not("priced.price_bgn", "is", null)
          .is("priced", null)
      ),
      count("products", products()),
      Promise.all(
        PRODUCT_SOURCES.map(async (source) => [
          source,
          await count(`source ${source}`, products().eq("source", source)),
        ] as const)
      ),
      count("fetches 24h", fetches().gte("fetched_at", dayAgo)),
      count("errors 24h", fetches().gte("fetched_at", dayAgo).not("ok", "is", true)),
      Promise.all(
        days.map(async ({ start, end }) => {
          const range = () =>
            fetches()
              .gte("fetched_at", start.toISOString())
              .lt("fetched_at", end.toISOString());
          const [total, errors] = await Promise.all([
            count("daily", range()),
            count("daily errors", range().not("ok", "is", true)),
          ]);
          return { date: start.toISOString().slice(0, 10), total, errors };
        })
      ),
      supabase
        .from("fetch_log")
        .select("fetched_at")
        .not("fetched_at", "is", null)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw new Error(`last fetch: ${error.message}`);
          return data?.fetched_at ?? null;
        }),
    ]);

    return {
      generatedAt: now.toISOString(),
      published,
      confirmed,
      aiConfirmed,
      noProducts,
      publishedNoPrice,
      productTotal,
      bySource: Object.fromEntries(bySource) as Record<ProductSource, number>,
      fetches24h,
      errors24h,
      daily,
      lastFetch,
    };
  },
  ["ops-stats"],
  { revalidate: 60, tags: [SHOP_COUNTS_TAG] }
);

export type OpsStats = Awaited<ReturnType<typeof cachedOpsStats>>;

export async function getOpsStats(): Promise<OpsStats | { error: string }> {
  await requireUser();
  try {
    return await cachedOpsStats();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
