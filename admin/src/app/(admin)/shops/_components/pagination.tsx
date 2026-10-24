import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatCount } from "@/lib/format";
import { shopsHref, type ShopFilters } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export function Pagination({
  filters,
  total,
  pageSize,
}: {
  filters: ShopFilters;
  total: number;
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = filters.page;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  const link = (target: number, label: string, disabled: boolean) =>
    disabled ? (
      <span
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none opacity-50"
        )}
      >
        {label}
      </span>
    ) : (
      <Link
        href={shopsHref(filters, { page: target })}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {label}
      </Link>
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {formatCount(from)}–{formatCount(to)} от {formatCount(total)}
      </span>
      <div className="flex items-center gap-2">
        {link(1, "«", page <= 1)}
        {link(page - 1, "‹ Предишна", page <= 1)}
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        {link(page + 1, "Следваща ›", page >= pages)}
        {link(pages, "»", page >= pages)}
      </div>
    </div>
  );
}
