import Link from "next/link";

import { STATUS_STYLES } from "@/components/status-badge";
import { SHOP_STATUSES, STATUS_LABELS, type ShopStatus } from "@/lib/domain";
import { formatCount } from "@/lib/format";
import {
  SHOPS_VIEW,
  shopsHref,
  type ShopFilters,
  type ShopsView,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";

type Counts = { total: number; published?: number; byStatus: Record<ShopStatus, number> } | null;

// Chips are plain links: toggling one only changes the URL.
export function StatusChips({
  filters,
  counts,
  view = SHOPS_VIEW,
  statuses = SHOP_STATUSES,
  allLabel = "Всички",
  allCount,
  showPublished = false,
}: {
  filters: ShopFilters;
  counts: Counts;
  view?: ShopsView;
  statuses?: readonly ShopStatus[];
  allLabel?: string;
  allCount?: number;
  // A "Публикувани" chip after the statuses (it combines with them).
  showPublished?: boolean;
}) {
  const publishedOnly = filters.published === "yes";
  const toggle = (status: ShopStatus) =>
    filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={shopsHref(filters, { status: [] }, view)}
        className={cn(
          "rounded-full border px-3 py-1 text-sm transition-colors",
          filters.status.length === 0
            ? "border-foreground bg-foreground text-background"
            : "hover:bg-accent"
        )}
      >
        {allLabel}
        {counts || allCount != null ? (
          <span className="ml-1.5 tabular-nums opacity-70">
            {formatCount(allCount ?? counts?.total ?? 0)}
          </span>
        ) : null}
      </Link>
      {statuses.map((status) => {
        const active = filters.status.includes(status);
        return (
          <Link
            key={status}
            href={shopsHref(filters, { status: toggle(status) }, view)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active
                ? cn(STATUS_STYLES[status], "font-medium shadow-sm")
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {STATUS_LABELS[status]}
            {counts ? (
              <span className="ml-1.5 tabular-nums opacity-70">
                {formatCount(counts.byStatus[status])}
              </span>
            ) : null}
          </Link>
        );
      })}
      {showPublished ? (
        <>
          <span aria-hidden className="mx-1 w-px self-stretch bg-border" />
          <Link
            href={shopsHref(filters, { published: publishedOnly ? null : "yes" }, view)}
            aria-pressed={publishedOnly}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              publishedOnly
                ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800 shadow-sm dark:bg-emerald-950 dark:text-emerald-200"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            Публикувани
            {counts?.published != null ? (
              <span className="ml-1.5 tabular-nums opacity-70">{formatCount(counts.published)}</span>
            ) : null}
          </Link>
        </>
      ) : null}
    </div>
  );
}
