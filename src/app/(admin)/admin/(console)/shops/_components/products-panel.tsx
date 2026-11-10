"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { verifyVoucherUrl } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEur, formatEurRange, productEur } from "@/lib/format";
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
  const eur = productEur(product);
  const currency = (product.currency ?? "").toUpperCase();
  return (
    <li
      className={cn(
        "space-y-1 rounded-md border bg-background p-2",
        eur == null && "border-dashed"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-24 font-medium tabular-nums">
          {eur == null ? (
            <Badge variant="outline" className="border-dashed text-muted-foreground">
              чака
            </Badge>
          ) : (
            formatEur(eur)
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

// The one URL a human confirms: the shop's voucher page, where the site's
// "Купи от …" button goes. Products below are the crawler's, read-only.
function VoucherUrlForm({ shop }: { shop: ShopListRow }) {
  const [url, setUrl] = useState(shop.voucher_url ?? "");
  const [pending, startTransition] = useTransition();
  const confirmed = Boolean(shop.voucher_url) && shop.voucher_url_verified === true && url.trim() === shop.voucher_url;

  const save = () =>
    startTransition(async () => {
      try {
        const result = await verifyVoucherUrl(shop.id, url);
        if (!result) toast.error("Няма отговор от сървъра. Презаредете страницата.");
        else if (!result.ok) toast.error(result.error);
        else toast.success("Страницата с ваучери е потвърдена.");
      } catch {
        toast.error("Връзката със сървъра прекъсна. Нищо не е записано.");
      }
    });

  return (
    <div className="space-y-2">
      <label htmlFor={`voucher-url-${shop.id}`} className="text-xs font-medium">
        Страница с ваучери{" "}
        <span className="font-normal text-muted-foreground">— натам води „Купи от …“ на сайта</span>
      </label>
      <Input
        id={`voucher-url-${shop.id}`}
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        spellCheck={false}
        className="font-mono text-xs"
        placeholder="https://shop.bg/vouchers"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending || !url.trim() || confirmed}>
          {pending ? "Записване…" : confirmed ? "Потвърден ✓" : "Запиши и потвърди"}
        </Button>
        {shop.voucher_url ? (
          <a
            href={shop.voucher_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Отвори ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function ProductsPanel({ shop }: { shop: ShopListRow }) {
  const products = [...shop.voucher_products].sort(
    (a, b) => (a.price_bgn ?? Infinity) - (b.price_bgn ?? Infinity)
  );
  const range = minMax(
    products.flatMap((p) => {
      const eur = productEur(p);
      return eur == null ? [] : [eur];
    })
  );
  const waiting = products.filter((p) => productEur(p) == null).length;

  return (
    <div className="grid gap-6 border-t px-4 py-4 md:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="text-xs text-muted-foreground">Продукти ({products.length})</div>
          {range ? (
            <div className="text-lg font-semibold tabular-nums">
              {formatEurRange(range.min, range.max)}
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
          <p className="text-sm text-muted-foreground">Обхождането не е намерило продукти.</p>
        )}
      </div>
      <VoucherUrlForm key={shop.voucher_url ?? ""} shop={shop} />
    </div>
  );
}
