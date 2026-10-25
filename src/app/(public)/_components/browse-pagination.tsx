import Link from "next/link";

import { cn } from "@/lib/utils";

// Numbered links, not infinite scroll: cached pages and crawlable links.
function pageList(current: number, last: number) {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);
}

export function BrowsePagination({
  page,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (last <= 1) return null;
  const current = Math.min(page, last);
  const pages = pageList(current, last);
  const cell = "flex h-11 min-w-11 items-center justify-center rounded-[13px] border-2 border-brand-ink px-3 font-num text-sm font-semibold";

  return (
    <nav aria-label="Страници" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className={cn(cell, "bg-brand-card text-brand-ink")} rel="prev">
          ‹ Назад
        </Link>
      ) : null}
      {pages.map((page, i) => (
        <span key={page} className="flex items-center gap-2">
          {i > 0 && page - pages[i - 1] > 1 ? <span className="px-1 text-brand-quiet">…</span> : null}
          <Link
            href={hrefFor(page)}
            aria-current={page === current ? "page" : undefined}
            className={cn(cell, page === current ? "bg-brand-ink text-brand-card" : "bg-brand-card text-brand-ink")}
          >
            {page}
          </Link>
        </span>
      ))}
      {current < last ? (
        <Link href={hrefFor(current + 1)} className={cn(cell, "bg-brand-card text-brand-ink")} rel="next">
          Напред ›
        </Link>
      ) : null}
    </nav>
  );
}
