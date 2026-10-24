import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { GIFT_APPEAL_LABELS, isGiftAppeal } from "@/lib/domain";
import {
  formatBgnRange,
  formatConfidence,
  formatEurRange,
  parseStatusReason,
  toBgn,
} from "@/lib/format";
import type { ShopListRow } from "@/lib/queries/shops";

const SOURCE_STYLES: Record<string, string> = {
  og: "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
  jsonld: "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
  text: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
  manual: "border-dashed text-muted-foreground",
};

function minMax(values: number[]) {
  return values.length
    ? { min: Math.min(...values), max: Math.max(...values) }
    : null;
}

function PriceCell({ shop }: { shop: ShopListRow }) {
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
            <Badge
              key={source}
              variant="outline"
              className={SOURCE_STYLES[source] ?? ""}
            >
              {source}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // No real prices yet: fall back to the AI-extracted offer, clearly marked.
  const offer = shop.voucher_offers[0];
  const offerValues = offer
    ? [offer.min_value, offer.max_value, ...(offer.denominations ?? [])]
        .map((v) => toBgn(v, offer.currency))
        .filter((v): v is number => v != null)
    : [];
  const offerRange = minMax(offerValues);

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
        <div className="text-xs">
          {products.length} прод., чакат цена
        </div>
      ) : null}
    </div>
  );
}

export function ShopsTable({ rows }: { rows: ShopListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Няма магазини, които отговарят на филтрите.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Магазин</th>
            <th className="px-3 py-2 font-medium">Статус</th>
            <th className="px-3 py-2 font-medium">Категория</th>
            <th className="px-3 py-2 font-medium">Привлек.</th>
            <th className="px-3 py-2 font-medium">Цени</th>
            <th className="px-3 py-2 text-right font-medium">Увер.</th>
            <th className="px-3 py-2 font-medium">Публ.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((shop) => {
            const { verdict, quote } = parseStatusReason(shop.status_reason);
            return (
              <tr key={shop.id} className="align-top hover:bg-muted/40">
                <td className="max-w-md px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/shops/${shop.id}`}
                      className="font-medium hover:underline"
                    >
                      {shop.domain}
                    </Link>
                    {shop.voucher_url_verified ? (
                      <BadgeCheck
                        className="size-4 shrink-0 text-emerald-600"
                        aria-label="URL потвърден"
                      >
                        <title>URL потвърден</title>
                      </BadgeCheck>
                    ) : null}
                  </div>
                  {shop.name && shop.name !== shop.domain ? (
                    <div className="text-xs text-muted-foreground">
                      {shop.name}
                    </div>
                  ) : null}
                  {quote || verdict ? (
                    <p
                      className="mt-1 line-clamp-2 text-xs"
                      title={shop.status_reason ?? undefined}
                    >
                      {quote ? (
                        <span className="italic">„{quote}“</span>
                      ) : null}
                      {verdict ? (
                        <span className="ml-1 text-muted-foreground">
                          — {verdict}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={shop.status} />
                </td>
                <td className="px-3 py-2">
                  <div>{shop.category ?? "—"}</div>
                  {shop.subcategory ? (
                    <div className="text-xs text-muted-foreground">
                      {shop.subcategory}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {shop.gift_appeal
                    ? isGiftAppeal(shop.gift_appeal)
                      ? GIFT_APPEAL_LABELS[shop.gift_appeal]
                      : shop.gift_appeal
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <PriceCell shop={shop} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatConfidence(shop.confidence)}
                </td>
                <td className="px-3 py-2">
                  {shop.published ? (
                    <Badge className="bg-emerald-600 text-white">Да</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
