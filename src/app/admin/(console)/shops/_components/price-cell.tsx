import { Badge } from "@/components/ui/badge";
import { formatBgnRange, formatEurRange, toBgn } from "@/lib/format";
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

export function offerValuesBgn(offer: ShopListRow["voucher_offers"][number] | undefined) {
  if (!offer) return [];
  return [offer.min_value, offer.max_value, ...(offer.denominations ?? [])]
    .map((v) => toBgn(v, offer.currency))
    .filter((v): v is number => v != null);
}

export function PriceCell({ shop }: { shop: ShopListRow }) {
  const products = shop.voucher_products;
  const prices = minMax(
    products.flatMap((p) => (p.price_bgn == null ? [] : [p.price_bgn]))
  );
  const sources = Array.from(
    new Set(products.flatMap((p) => (p.source ? [p.source] : [])))
  );

  if (prices) {
    return (
      <div className="space-y-1">
        <div className="font-medium tabular-nums">
          {formatBgnRange(prices.min, prices.max)}
        </div>
        <div className="text-xs tabular-nums text-muted-foreground">
          {formatEurRange(prices.min, prices.max)}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">
            {products.length} прод.
          </span>
          {sources.map((source) => (
            <SourceBadge key={source} source={source} />
          ))}
        </div>
      </div>
    );
  }

  // No real prices yet: fall back to the AI-extracted offer, clearly marked.
  const offerRange = minMax(offerValuesBgn(shop.voucher_offers[0]));

  return (
    <div className="space-y-1 text-muted-foreground">
      {offerRange ? (
        <div className="tabular-nums" title="Извлечено от AI, без реални цени">
          ≈ {formatBgnRange(offerRange.min, offerRange.max)}{" "}
          <span className="text-xs">(AI)</span>
        </div>
      ) : (
        <div>—</div>
      )}
      {products.length ? (
        <div className="text-xs">{products.length} прод., чакат цена</div>
      ) : null}
    </div>
  );
}
