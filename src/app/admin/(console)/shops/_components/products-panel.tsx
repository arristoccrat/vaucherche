"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { verifyVoucherUrls } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BGN_PER_EUR } from "@/lib/domain";
import { formatBgnRange, formatEurRange } from "@/lib/format";
import type { ShopListRow } from "@/lib/queries/shops";
import { cn } from "@/lib/utils";

import { SourceBadge, minMax } from "./price-cell";
import { RawDrawer } from "./raw-drawer";

type Product = ShopListRow["voucher_products"][number];

const number = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 });

function shortUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function ProductRow({ product }: { product: Product }) {
  const waiting = product.price_bgn == null;
  const currency = (product.currency ?? "").toUpperCase();
  return (
    <li
      className={cn(
        "space-y-1 rounded-md border bg-background p-2",
        waiting && "border-dashed"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-24 font-medium tabular-nums">
          {waiting ? (
            <Badge variant="outline" className="border-dashed text-muted-foreground">
              чака
            </Badge>
          ) : (
            <>
              {number.format(product.price_bgn!)} лв
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {number.format(product.price_bgn! / BGN_PER_EUR)} €
              </span>
            </>
          )}
        </div>
        {product.price != null && currency && currency !== "BGN" && currency !== "EUR" ? (
          <span className="text-xs text-muted-foreground">
            ({number.format(product.price)} {currency})
          </span>
        ) : null}
        {product.source ? <SourceBadge source={product.source} /> : null}
        {product.availability ? (
          <span className="text-xs text-muted-foreground">{product.availability}</span>
        ) : null}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          title={product.url}
        >
          <span className="truncate">{product.title || shortUrl(product.url)}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </div>
      <RawDrawer productId={product.id} />
    </li>
  );
}

function UrlVerifier({ shop }: { shop: ShopListRow }) {
  const initial = Array.from(
    new Set(
      [shop.voucher_url, ...shop.voucher_products.map((p) => p.url)].filter(
        (url): url is string => Boolean(url)
      )
    )
  ).join("\n");
  const [text, setText] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      try {
        const result = await verifyVoucherUrls(shop.id, text);
        if (!result) toast.error("Няма отговор от сървъра. Презаредете страницата.");
        else if (!result.ok) toast.error(result.error);
        else
          toast.success(
            `URL потвърден. Нови продукти: ${result.data.added}, вече записани: ${result.data.existing}.`
          );
      } catch {
        toast.error("Връзката със сървъра прекъсна. Нищо не е записано.");
      }
    });

  return (
    <div className="space-y-2">
      <label htmlFor={`urls-${shop.id}`} className="text-xs font-medium">
        Потвърди URL адреси{" "}
        <span className="font-normal text-muted-foreground">
          — по един на ред; първият е основната страница с ваучери
        </span>
      </label>
      <textarea
        id={`urls-${shop.id}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={Math.min(Math.max(text.split("\n").length, 3), 10)}
        spellCheck={false}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder="https://shop.bg/vouchers&#10;https://shop.bg/voucher-50&#10;https://shop.bg/voucher-100"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Записване…" : "Запиши и потвърди"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Новите редове стават продукти „чака“ до следващото обхождане. Изтриването на ред не изтрива продукт.
        </span>
      </div>
    </div>
  );
}

export function ProductsPanel({ shop }: { shop: ShopListRow }) {
  const products = [...shop.voucher_products].sort(
    (a, b) => (a.price_bgn ?? Infinity) - (b.price_bgn ?? Infinity)
  );
  const range = minMax(
    products.flatMap((p) => (p.price_bgn == null ? [] : [p.price_bgn]))
  );
  const waiting = products.filter((p) => p.price_bgn == null).length;

  return (
    <div className="grid gap-6 border-t px-4 py-4 md:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="text-xs text-muted-foreground">Продукти ({products.length})</div>
          {range ? (
            <div className="text-lg font-semibold tabular-nums">
              {formatBgnRange(range.min, range.max)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {formatEurRange(range.min, range.max)}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Няма реални цени</div>
          )}
          {waiting ? (
            <span className="text-xs text-muted-foreground">{waiting} чакат цена</span>
          ) : null}
        </div>
        {products.length ? (
          <ul className="space-y-2">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Няма записани продукти. Добавете URL адресите вдясно.
          </p>
        )}
      </div>
      <UrlVerifier key={`${shop.voucher_url}|${products.length}`} shop={shop} />
    </div>
  );
}
