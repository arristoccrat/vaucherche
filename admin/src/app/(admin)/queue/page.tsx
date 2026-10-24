import Link from "next/link";

import { QueryError } from "@/components/query-error";
import { formatCount } from "@/lib/format";
import {
  QUEUE_STATUSES,
  SHOPS_PAGE_SIZE,
  getQueueCounts,
  getShopFacets,
  listShops,
} from "@/lib/queries/shops";
import {
  QUEUE_VIEW,
  parseShopFilters,
  serializeShopFilters,
  type ShopFilters,
} from "@/lib/search-params";

import { FilterBar } from "../shops/_components/filter-bar";
import { Pagination } from "../shops/_components/pagination";
import { ShopsBrowser } from "../shops/_components/shops-browser";
import { StatusChips } from "../shops/_components/status-chips";

// Everything confirmed (by evidence, a human, or the AI) but not yet live,
// highest gift appeal first. Each row shows what still blocks publishing.
export default async function QueuePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseShopFilters(searchParams, QUEUE_VIEW.defaults);
  const status = filters.status.filter((s) =>
    (QUEUE_STATUSES as readonly string[]).includes(s)
  );
  // What the query (and "select all matching") actually uses.
  const effective: ShopFilters = {
    ...filters,
    status: status.length ? status : [...QUEUE_STATUSES],
    published: "no",
  };

  const [result, counts, facets] = await Promise.all([
    listShops({ ...effective, pageSize: SHOPS_PAGE_SIZE }).catch(
      (error: unknown) => ({
        error: error instanceof Error ? error.message : String(error),
      })
    ),
    getQueueCounts(),
    getShopFacets(),
  ]);
  if ("error" in result) return <QueryError message={result.error} />;

  const hasFilters =
    serializeShopFilters({ ...filters, page: 1 }, QUEUE_VIEW.defaults).toString() !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Опашка за публикуване</h1>
          <p className="text-sm text-muted-foreground">
            Потвърдени, но непубликувани магазини — по привлекателност, после категория.
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCount(result.total)} резултата · {result.durationMs} ms
        </span>
      </div>

      <StatusChips
        filters={{ ...filters, status }}
        counts={counts}
        view={QUEUE_VIEW}
        statuses={QUEUE_STATUSES}
        allLabel="Всички потвърдени"
      />

      <FilterBar
        filters={filters}
        categories={facets.categories}
        giftAppeals={facets.giftAppeals}
        view={QUEUE_VIEW}
        hidePublished
      />

      {hasFilters ? (
        <Link
          href={QUEUE_VIEW.basePath}
          className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Изчисти филтрите
        </Link>
      ) : null}

      <ShopsBrowser
        rows={result.rows}
        total={result.total}
        filterQuery={serializeShopFilters({ ...effective, page: 1 }).toString()}
        categories={facets.categories.map((c) => c.value)}
        showPublishChecklist
      />

      <Pagination
        filters={filters}
        total={result.total}
        pageSize={result.pageSize}
        view={QUEUE_VIEW}
      />
    </div>
  );
}
