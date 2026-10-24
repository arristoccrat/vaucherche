import { Check, ExternalLink, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatBgnRange, formatEurRange, parseStatusReason, toBgn } from "@/lib/format";
import { publishChecks } from "@/lib/publish";
import type { ShopListRow } from "@/lib/queries/shops";
import { cn } from "@/lib/utils";

import { EditorialForm } from "./editorial-form";
import { minMax, offerValuesBgn } from "./price-cell";
import { ProductsPanel } from "./products-panel";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function yesNo(value: boolean | null | undefined) {
  return value == null ? "—" : value ? "Да" : "Не";
}

export type ShopActions = {
  confirm: () => void;
  reject: () => void;
  skip: () => void;
  setPublished: (published: boolean) => void;
  togglePublished: () => void;
  open: () => void;
};

export function ShopDetail({
  shop,
  actions,
  categories,
}: {
  shop: ShopListRow;
  actions: ShopActions;
  categories: string[];
}) {
  const { verdict, quote } = parseStatusReason(shop.status_reason);
  const offer = shop.voucher_offers[0];
  const offerRange = minMax(offerValuesBgn(offer));
  const checks = publishChecks(shop);

  return (
    <div className="bg-muted/30">
      <div className="grid gap-6 px-4 py-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Доказателство</div>
            {quote ? (
              <blockquote className="mt-1 border-l-2 pl-3 text-base italic">
                „{quote}“
              </blockquote>
            ) : null}
            <div className="mt-1 text-xs text-muted-foreground">
              {verdict ?? "Няма бележка"}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Fact label="Номинали">
              {offer?.denominations?.length
                ? offer.denominations
                    .map((d) => toBgn(d, offer.currency))
                    .filter((d): d is number => d != null)
                    .map((d) => formatBgnRange(d, d))
                    .join(", ")
                : "—"}
            </Fact>
            <Fact label="Диапазон (AI)">
              {offerRange ? (
                <>
                  {formatBgnRange(offerRange.min, offerRange.max)}
                  <span className="block text-xs text-muted-foreground">
                    {formatEurRange(offerRange.min, offerRange.max)}
                  </span>
                </>
              ) : (
                "—"
              )}
            </Fact>
            <Fact label="Свободна сума">{yesNo(offer?.custom_amount)}</Fact>
            <Fact label="Дигитален / физически">
              {yesNo(offer?.is_digital)} / {yesNo(offer?.is_physical)}
            </Fact>
            <Fact label="Доставка">
              {offer?.delivery_methods?.length ? offer.delivery_methods.join(", ") : "—"}
            </Fact>
            <Fact label="Валидност">
              {offer?.validity_months ? `${offer.validity_months} мес.` : "—"}
            </Fact>
            <Fact label="Персонализиране">{yesNo(offer?.personalisable)}</Fact>
            <Fact label="Тип ваучер">{shop.voucher_type ?? "—"}</Fact>
            <Fact label="Проверен от човек">
              {offer?.verified_by_human ? "Да" : "Не"}
            </Fact>
          </dl>

          <div className="space-y-1 text-sm">
            <div className="text-xs text-muted-foreground">URL на ваучерите</div>
            {shop.voucher_url ? (
              <a
                href={shop.voucher_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline-offset-4 hover:underline"
              >
                {shop.voucher_url}
              </a>
            ) : (
              <span>—</span>
            )}
            {shop.voucher_url_note ? (
              <p className="text-xs text-muted-foreground">{shop.voucher_url_note}</p>
            ) : null}
            {offer?.terms_url ? (
              <a
                href={offer.terms_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs underline-offset-4 hover:underline"
              >
                Условия
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={actions.confirm}>
              Потвърди <kbd className="text-xs opacity-60">1</kbd>
            </Button>
            <Button size="sm" variant="outline" onClick={actions.reject}>
              Отхвърли <kbd className="text-xs opacity-60">2</kbd>
            </Button>
            <Button size="sm" variant="ghost" onClick={actions.skip}>
              Пропусни <kbd className="text-xs opacity-60">3</kbd>
            </Button>
            <Button size="sm" variant="outline" onClick={actions.open}>
              <ExternalLink /> Отвори <kbd className="text-xs opacity-60">o</kbd>
            </Button>
          </div>

          <div className="space-y-2 rounded-md border bg-background p-3">
            <div className="text-xs font-medium">За публикуване</div>
            <ul className="space-y-1 text-sm">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    "flex items-start gap-2",
                    !check.ok && "text-muted-foreground"
                  )}
                >
                  {check.ok ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-rose-500" />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant={shop.published ? "outline" : "default"}
              className="w-full"
              disabled={!shop.published && checks.some((c) => !c.ok)}
              onClick={actions.togglePublished}
            >
              {shop.published ? "Свали от сайта" : "Публикувай"}
            </Button>
          </div>

          <Link
            href={`/admin/shops/${shop.id}`}
            className="block text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Пълна страница →
          </Link>
        </div>
      </div>
      <EditorialForm key={shop.id} shop={shop} categories={categories} />
      <ProductsPanel shop={shop} />
    </div>
  );
}
