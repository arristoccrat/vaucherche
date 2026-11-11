import { CalendarClock, CreditCard, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { onColorHex, type Category } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
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
  const Icon = categoryIcon(category.icon);
  const onColor = onColorHex(category.on);
  const name = shop.name?.trim() || shop.domain || "";
  const description =
    shop.description?.trim() || [shop.subcategory, shop.domain].filter(Boolean).join(" · ");
  const amounts = shop.denominations_eur ?? [];
  const shown = amounts.slice(0, 3);
  const more = amounts.length - shown.length;
  const meta = [deliveryLabel(shop), validityLabel(shop.validity_months)].filter(Boolean).join(" · ");
  const MetaIcon = !shop.is_digital && !shop.is_physical ? CalendarClock : shop.is_physical && !shop.is_digital ? CreditCard : Mail;

  return (
    <article className="group relative overflow-hidden rounded-[20px] border-2 border-brand-ink bg-brand-card">
      {/* The shop's logo, large on white; without one, its initial on the
          category colour. Covers are for the shop page: on a grid they
          crowd each other out and hide the logo. */}
      {shop.logo_url ? (
        <div className="relative h-[110px] border-b-2 border-brand-ink bg-brand-card md:h-[132px]">
          <Image
            src={shop.logo_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-contain px-10 py-6"
            priority={priority}
          />
        </div>
      ) : (
        <div
          className="flex h-[110px] flex-col items-center justify-center gap-1 border-b-2 border-brand-ink md:h-[132px]"
          style={{ backgroundColor: category.bg, color: onColor }}
        >
          <span className="font-display text-[40px] font-extrabold leading-none" aria-hidden>
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="flex items-center gap-1 font-num text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
            <Icon className="size-3.5" aria-hidden strokeWidth={2} />
            {category.label}
          </span>
        </div>
      )}

      <div className="px-4 pb-4 pt-3">
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
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-brand-body">
            <MetaIcon className="size-3.5 shrink-0" style={{ color: category.on === "ink" ? onColorHex("ink") : category.bg }} aria-hidden />
            {meta}
          </p>
        ) : null}
      </div>
    </article>
  );
}
