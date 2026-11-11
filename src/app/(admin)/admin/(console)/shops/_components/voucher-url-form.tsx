"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateShopEditorial } from "@/actions/editorial";
import { verifyVoucherUrl } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CTA_KINDS, ctaLabel } from "@/lib/cta";
import type { ShopListRow } from "@/lib/queries/shops";

import { FieldLabel, fieldClass, useAutosave } from "./autosave";

// The one URL a human confirms: the shop's voucher page, where the site's
// "Купи от …" button goes.
export function VoucherUrlForm({ shop }: { shop: ShopListRow }) {
  const [url, setUrl] = useState(shop.voucher_url ?? "");
  const [pending, startTransition] = useTransition();
  const confirmed = Boolean(shop.voucher_url) && shop.voucher_url_verified === true && url.trim() === shop.voucher_url;

  const cta = useAutosave((value) => updateShopEditorial(shop.id, { cta_kind: value }), shop.cta_kind ?? "buy");
  const domain = shop.domain ?? "магазина";

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
        <span className="font-normal text-muted-foreground">— натам води бутонът на сайта</span>
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
      <div className="max-w-xs space-y-1 pt-2">
        <FieldLabel htmlFor={`cta-${shop.id}`} label="Текст на бутона" state={cta.state} />
        <select
          id={`cta-${shop.id}`}
          value={cta.value}
          onChange={(event) => cta.change(event.target.value, true)}
          className={fieldClass}
        >
          {CTA_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {ctaLabel(k.key, domain)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
