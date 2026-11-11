import Image from "next/image";
import Link from "next/link";

import { onColorHex, tintHex, type Category } from "@/lib/categories";
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
  if (months === 0) return "безсрочен";
  if (!months) return null;
  return `валиден ${months} ${months === 1 ? "месец" : "месеца"}`;
}

// Each card leans its own way: an angle picked from the shop's slug, so it
// stays the same on every render (and on the server and the client).
const TILTS = [-4, -3, -2, 2, 3, 4];
function tiltFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TILTS[Math.abs(hash) % TILTS.length];
}

// `category` is the shop's category resolved by the page (categoryOrFallback).
export function ShopCard({
  shop,
  category,
  priority = false,
}: {
  shop: ShopCardData;
  category: Category;
  priority?: boolean;
}) {
  const onColor = onColorHex(category.on);
  const name = shop.name?.trim() || shop.domain || "";
  const description =
    shop.description?.trim() || [shop.subcategory, shop.domain].filter(Boolean).join(" · ");
  const amounts = shop.denominations_eur ?? [];
  const shown = amounts.slice(0, 3);
  const more = amounts.length - shown.length;
  const meta = [deliveryLabel(shop), validityLabel(shop.validity_months)].filter(Boolean).join(" · ");
  // Ink letters on light colours, the colour itself on dark ones (both clear 4.5:1 on white).
  const monogramColor = category.on === "ink" ? onColorHex("ink") : category.bg;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border-2 border-brand-ink bg-brand-card">
      {/* A gift card on a wash of the category colour: the shop's logo on a
          white card, tilted, with a hard ink shadow. Without a logo the card
          carries the shop's initial. Covers stay on the shop page. */}
      <div
        className="flex aspect-[19/10] shrink-0 items-center justify-center border-b-2 border-brand-ink"
        style={{ backgroundColor: tintHex(category.bg) }}
      >
        <div
          className="relative aspect-[1.6] w-[64%] rotate-[var(--tilt)] rounded-[14px] border-2 border-brand-ink bg-brand-card shadow-[5px_6px_0_0] shadow-brand-ink transition-transform duration-200 group-hover:rotate-0"
          style={{ "--tilt": `${tiltFor(shop.slug ?? name)}deg` } as React.CSSProperties}
        >
          {shop.logo_url ? (
            <Image
              src={shop.logo_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 768px) 32vw, 64vw"
              className="object-contain p-[12%]"
              priority={priority}
            />
          ) : (
            <span
              className="absolute inset-0 flex items-center justify-center font-display text-[44px] font-extrabold"
              style={{ color: monogramColor }}
              aria-hidden
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Fills the card, so cards in a row are equally tall and the meta
          line sits at the bottom of each. */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
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
          <p className="mt-3 line-clamp-4 min-h-[2lh] text-[14px] leading-snug text-brand-body">{description}</p>
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
          <p className="mt-auto pt-3 text-[12.5px] font-medium text-brand-body">{meta}</p>
        ) : null}
      </div>
    </article>
  );
}
