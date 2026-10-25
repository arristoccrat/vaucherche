import { CalendarClock, CreditCard, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getCategory, onColorHex } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

// One card for every public surface (Main / Desktop artboards). Takes data as
// props and imports no Supabase client. Every field has a fallback: the
// description, logo and amounts are empty for most shops today.

export type ShopCardData = {
  slug: string | null;
  name: string | null;
  domain: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string | null;
  subcategory: string | null;
  denominations_eur: number[] | null;
  custom_amount: boolean | null;
  is_digital: boolean | null;
  is_physical: boolean | null;
  validity_months: number | null;
};

const amount = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 });

function deliveryLabel(shop: ShopCardData) {
  if (shop.is_digital && shop.is_physical) return "Дигитален и физически";
  if (shop.is_digital) return "Дигитален";
  if (shop.is_physical) return "Физическа карта";
  return null;
}

function validityLabel(months: number | null) {
  if (!months) return null;
  return `валиден ${months} ${months === 1 ? "месец" : "месеца"}`;
}

export function ShopCard({ shop, priority = false }: { shop: ShopCardData; priority?: boolean }) {
  const category = getCategory(shop.category);
  const Icon = CATEGORY_ICONS[category.key];
  const onColor = onColorHex(category.on);
  const name = shop.name?.trim() || shop.domain || "";
  const description =
    shop.description?.trim() || [shop.subcategory, shop.domain].filter(Boolean).join(" · ");
  const amounts = shop.denominations_eur ?? [];
  const shown = amounts.slice(0, 3);
  const more = amounts.length - shown.length;
  const meta = [deliveryLabel(shop), validityLabel(shop.validity_months)].filter(Boolean).join(" · ");
  const MetaIcon = !shop.is_digital && !shop.is_physical ? CalendarClock : shop.is_physical && !shop.is_digital ? CreditCard : Mail;
  // Ink letters on light bands, the band colour on dark ones (both clear 4.5:1 on white).
  const monogramColor = category.on === "ink" ? onColorHex("ink") : category.bg;

  return (
    <article className="group relative overflow-hidden rounded-[20px] border-2 border-brand-ink bg-brand-card">
      <div
        className="relative flex h-[110px] flex-col items-center justify-center gap-1.5 md:h-[132px]"
        style={{ backgroundColor: category.bg, color: onColor }}
      >
        {shop.cover_url ? (
          <Image
            src={shop.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <>
            <Icon className="size-6 opacity-80" aria-hidden strokeWidth={2} />
            <span className="font-num text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
              {category.label}
            </span>
          </>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="relative -mt-[26px] flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-2 border-brand-ink bg-brand-card md:size-[56px]">
            {shop.logo_url ? (
              <Image src={shop.logo_url} alt="" fill sizes="56px" className="object-contain p-1.5" />
            ) : (
              <span className="font-display text-[22px] font-extrabold" style={{ color: monogramColor }} aria-hidden>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 pt-2">
            <h3 className="truncate font-ui text-[17px] font-extrabold leading-tight text-brand-ink">
              <Link href={`/magazin/${shop.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {name}
              </Link>
            </h3>
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 font-ui text-[10px] font-extrabold uppercase tracking-[0.04em]"
              style={{ backgroundColor: category.bg, color: onColor }}
            >
              {category.label}
            </span>
          </div>
        </div>

        {description ? (
          <p className="mt-3 line-clamp-2 min-h-[2lh] text-[14px] leading-snug text-brand-body">{description}</p>
        ) : null}

        {shown.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5 font-num text-[13px] font-semibold" aria-label="Номинали">
            {shown.map((value, i) => (
              <li
                key={value}
                className={cn(
                  "rounded-[12px] border-2 border-brand-ink px-2.5 py-1",
                  i === 0 ? "bg-brand-ink text-brand-card" : "bg-brand-card text-brand-ink"
                )}
              >
                {amount.format(value)}
                {i === 0 ? " €" : ""}
              </li>
            ))}
            {more > 0 ? (
              <li className="rounded-[12px] border-2 border-dashed border-brand-dashed px-2.5 py-1 text-brand-quiet">
                +{more}
              </li>
            ) : null}
          </ul>
        ) : shop.custom_amount ? (
          <p className="mt-3 inline-block rounded-[12px] border-2 border-brand-ink px-2.5 py-1 font-num text-[13px] font-semibold text-brand-ink">
            Сума по избор
          </p>
        ) : null}

        {meta ? (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-brand-body">
            <MetaIcon className="size-3.5 shrink-0" style={{ color: category.on === "ink" ? onColorHex("ink") : category.bg }} aria-hidden />
            {meta}
          </p>
        ) : null}
      </div>
    </article>
  );
}
