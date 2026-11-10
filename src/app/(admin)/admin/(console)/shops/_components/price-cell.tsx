import { Badge } from "@/components/ui/badge";
import { formatEurRange, toEur } from "@/lib/format";
import type { ShopListRow } from "@/lib/queries/shops";

const SOURCE_STYLES: Record<string, string> = {
  og: "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
  jsonld: "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
  text: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
  manual: "border-dashed text-muted-foreground",
};

export function SourceBadge({ source }: { source: string }) {
  return (
    <Badge variant="outline" className={SOURCE_STYLES[source] ?? ""}>
      {source}
    </Badge>
  );
}

export function minMax(values: number[]) {
  return values.length
    ? { min: Math.min(...values), max: Math.max(...values) }
    : null;
}

export function offerValuesEur(offer: ShopListRow["voucher_offers"][number] | undefined) {
  if (!offer) return [];
  return [offer.min_value, offer.max_value, ...(offer.denominations ?? [])]
    .map((v) => toEur(v, offer.currency))
    .filter((v): v is number => v != null);
}

// The list's amount column: the offer's "Номинали" (and custom-amount
// limits), the same field the public site shows.
export function PriceCell({ shop }: { shop: ShopListRow }) {
  const offer = shop.voucher_offers[0];
  const range = minMax(offerValuesEur(offer));
  const count = offer?.denominations?.length ?? 0;
  if (!range) return <div className="text-muted-foreground">—</div>;
  return (
    <div className="space-y-0.5">
      <div className="font-medium tabular-nums">{formatEurRange(range.min, range.max)}</div>
      <div className="text-xs text-muted-foreground">
        {[count ? `${count} ${count === 1 ? "номинал" : "номинала"}` : null, offer?.custom_amount ? "сума по избор" : null].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}
