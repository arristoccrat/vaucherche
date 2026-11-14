import Link from "next/link";

import { STATUS_STYLES } from "@/components/status-badge";
import { ACTIVE_STATUSES, STATUS_LABELS, type ShopStatus } from "@/lib/domain";
import { formatCount } from "@/lib/format";
import {
  SHOPS_VIEW,
  shopsHref,
  type ShopFilters,
  type ShopsView,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";

type Counts = {
  total: number;
  published?: number;
  byStatus: Record<ShopStatus, number>;
  unpublishedByStatus?: Record<ShopStatus, number>;
} | null;

// Chips are plain links: toggling one only changes the URL.
export function StatusChips({
  filters,
  counts,
  view = SHOPS_VIEW,
  statuses = ACTIVE_STATUSES,
  archivedStatuses = [],
  allLabel = "Всички",
  allCount,
  showPublished = false,
}: {
  filters: ShopFilters;
  counts: Counts;
  view?: ShopsView;
  statuses?: readonly ShopStatus[];
  // Shown apart, muted, after an "Архив" label: kept for the record, out of
  // "Всички" (see ACTIVE_STATUSES), one click away when needed.
  archivedStatuses?: readonly ShopStatus[];
  allLabel?: string;
  allCount?: number;
  // The shop list's groups: one chip at a time, each opening its own set.
  // The status chips hold unpublished shops only; published ones live under
  // "Публикувани", so publishing a shop moves it from its status to there.
  showPublished?: boolean;
}) {
  const exclusive = showPublished;
  const publishedOnly = filters.published === "yes";
  const statusCount = (s: ShopStatus) =>
    counts ? (exclusive ? (counts.unpublishedByStatus ?? counts.byStatus)[s] : counts.byStatus[s]) : 0;
  // "Всички" counts what it lists: the statuses shown before the archive
  // (and, in the shop list, the published shops too).
  const allTotal =
    allCount ??
    (counts ? statuses.reduce((sum, s) => sum + statusCount(s), 0) + (exclusive ? (counts.published ?? 0) : 0) : 0);
  const allActive = filters.status.length === 0 && !(exclusive && filters.published);
  const statusActive = (status: ShopStatus) =>
    exclusive ? filters.status.length === 1 && filters.status[0] === status && filters.published !== "yes" : filters.status.includes(status);
  const statusHref = (status: ShopStatus) => {
    if (exclusive) {
      return statusActive(status)
        ? shopsHref(filters, { status: [], published: null }, view)
        : shopsHref(filters, { status: [status], published: "no" }, view);
    }
    const next = filters.status.includes(status) ? filters.status.filter((s) => s !== status) : [...filters.status, status];
    return shopsHref(filters, { status: next }, view);
  };
  const publishedActive = publishedOnly && filters.status.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={shopsHref(filters, exclusive ? { status: [], published: null } : { status: [] }, view)}
        aria-pressed={allActive}
        className={cn(
          "rounded-full border px-3 py-1 text-sm transition-colors",
          allActive
            ? "border-foreground bg-foreground text-background"
            : "hover:bg-accent"
        )}
      >
        {allLabel}
        {counts || allCount != null ? (
          <span className="ml-1.5 tabular-nums opacity-70">{formatCount(allTotal)}</span>
        ) : null}
      </Link>
      {statuses.map((status) => {
        const active = statusActive(status);
        return (
          <Link
            key={status}
            href={statusHref(status)}
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
                {formatCount(statusCount(status))}
              </span>
            ) : null}
          </Link>
        );
      })}
      {archivedStatuses.length ? (
        <>
          <span aria-hidden className="mx-1 w-px self-stretch bg-border" />
          <span className="self-center text-xs text-muted-foreground">Архив:</span>
          {archivedStatuses.map((status) => {
            const active = statusActive(status);
            return (
              <Link
                key={status}
                href={statusHref(status)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border border-dashed px-2.5 py-0.5 text-xs transition-colors",
                  active
                    ? cn(STATUS_STYLES[status], "border-solid font-medium shadow-sm")
                    : "text-muted-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                {STATUS_LABELS[status]}
                {counts ? (
                  <span className="ml-1.5 tabular-nums opacity-70">{formatCount(statusCount(status))}</span>
                ) : null}
              </Link>
            );
          })}
        </>
      ) : null}
      {showPublished ? (
        <>
          <span aria-hidden className="mx-1 w-px self-stretch bg-border" />
          <Link
            href={shopsHref(filters, publishedActive ? { status: [], published: null } : { status: [], published: "yes" }, view)}
            aria-pressed={publishedActive}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              publishedActive
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
