import Link from "next/link";

import { QueryError } from "@/components/query-error";
import { categoryOptions } from "@/lib/categories";
import { ARCHIVED_STATUSES } from "@/lib/domain";
import { formatCount } from "@/lib/format";
import {
  SHOPS_PAGE_SIZE,
  getShopFacets,
  getStatusCounts,
  listShops,
} from "@/lib/queries/shops";
import { getAdminCategories } from "@/lib/queries/categories";
import { parseShopFilters, serializeShopFilters } from "@/lib/search-params";

import { FilterBar } from "./_components/filter-bar";
import { Pagination } from "./_components/pagination";
import { ShopsBrowser } from "./_components/shops-browser";
import { StatusChips } from "./_components/status-chips";

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseShopFilters(searchParams);
  const [result, counts, facets, adminCategories] = await Promise.all([
    listShops({ ...filters, pageSize: SHOPS_PAGE_SIZE }).catch(
      (error: unknown) => ({
        error: error instanceof Error ? error.message : String(error),
      })
    ),
    getStatusCounts(),
    getShopFacets(),
    getAdminCategories(),
  ]);
  if ("error" in result) return <QueryError message={result.error} />;
  const categories = categoryOptions(adminCategories.active, adminCategories.archived);

  const hasFilters =
    serializeShopFilters({ ...filters, page: 1 }).toString() !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Магазини</h1>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCount(result.total)} резултата · {result.durationMs} ms
        </span>
      </div>

      <StatusChips filters={filters} counts={counts} archivedStatuses={ARCHIVED_STATUSES} showPublished />

      <FilterBar
        filters={filters}
        categories={facets.categories}
        categoryOptions={categories}
        giftAppeals={facets.giftAppeals}
      />

      {hasFilters ? (
        <Link
          href="/admin/shops"
          className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Изчисти филтрите
        </Link>
      ) : null}

      <ShopsBrowser
        categories={categories}
        rows={result.rows}
        total={result.total}
        filterQuery={serializeShopFilters({ ...filters, page: 1 }).toString()}
      />

      <Pagination
        filters={filters}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}
