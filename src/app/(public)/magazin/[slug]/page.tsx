import { ArrowUpRight, ChevronLeft, Clock, CreditCard, Gift, Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichText } from "@/components/rich-text";
import { categoryOrFallback, onColorHex } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
import { formatEur, formatEurRange } from "@/lib/format";
import { parseRichText } from "@/lib/rich-text";

import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { browsePath } from "../../_lib/browse-params";
import { outboundHref } from "../../_lib/outbound";
import { getVisibleCategories } from "../../_lib/categories";
import { getPublishedShop, type PublishedShop } from "../../_lib/shop";

// "24 окт 2026": ICU's bg-BG short month is numeric, so the names are ours.
const MONTHS = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];
const sofiaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" });
function checkedDate(iso: string) {
  const [year, month, day] = sofiaDate.format(new Date(iso)).split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function displayName(shop: PublishedShop["shop"]) {
  return shop.name?.trim() || shop.domain;
}

// Our own one-line copy when the editor has not written a description yet.
function fallbackDescription({ shop, amounts }: PublishedShop) {
  const range = amounts.length ? ` за ${formatEurRange(amounts[0], amounts[amounts.length - 1])}` : "";
  return `Подаръчни ваучери от ${shop.domain}${range}.`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPublishedShop(params.slug);
  if (!data) return { title: "Магазинът не е намерен — vaucherche" };
  const name = displayName(data.shop);
  const description = data.shop.description?.trim() || fallbackDescription(data);
  return {
    title: `${name} — подаръчни ваучери | vaucherche`,
    description,
    alternates: { canonical: `/magazin/${data.shop.slug}` },
    openGraph: {
      title: `${name} — подаръчни ваучери`,
      description,
      type: "website",
      locale: "bg_BG",
      images: data.shop.cover_url ? [data.shop.cover_url] : undefined,
    },
  };
}

type Fact = { icon: typeof Mail; title: string; detail: string };

function facts({ offer }: PublishedShop): Fact[] {
  if (!offer) return [];
  const list: Fact[] = [];
  if (offer.is_digital && offer.is_physical) list.push({ icon: Mail, title: "Дигитален или карта", detail: "по имейл или като физическа карта" });
  else if (offer.is_digital) list.push({ icon: Mail, title: "Дигитален", detail: "получава се по имейл" });
  else if (offer.is_physical) list.push({ icon: CreditCard, title: "Физическа карта", detail: "карта или хартиен ваучер" });
  if (offer.validity_months === 0) {
    list.push({ icon: Clock, title: "Безсрочен", detail: "без срок на валидност" });
  } else if (offer.validity_months) {
    list.push({ icon: Clock, title: `${offer.validity_months} ${offer.validity_months === 1 ? "месец" : "месеца"}`, detail: "валидност" });
  }
  if (offer.personalisable) list.push({ icon: Gift, title: "Персонализиран", detail: "с име или поздрав за подарения" });
  return list;
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getPublishedShop(params.slug);
  if (!data) notFound();
  const { shop, offer, amounts, customRange, firstProductUrl, lastChecked } = data;
  const canBuy = Boolean(shop.voucher_url || firstProductUrl);

  const { visible } = await getVisibleCategories();
  // A published shop's category always has a page; an unknown or archived
  // one shows the neutral fallback with no category link.
  const category = categoryOrFallback(visible, shop.category);
  const hasCategoryPage = category.key !== "";
  const Icon = categoryIcon(category.icon);
  const onColor = onColorHex(category.on);
  const monogramColor = category.on === "ink" ? onColorHex("ink") : category.bg;
  const name = displayName(shop);
  const description = shop.description?.trim() || fallbackDescription(data);
  const hasVoucherText = parseRichText(shop.voucher_description).length > 0;
  const factList = facts(data);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-3 lg:px-10 lg:pb-16 lg:pt-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          ...(hasCategoryPage ? [{ name: category.label, path: browsePath(category) }] : []),
          { name, path: `/magazin/${shop.slug}` },
        ]}
      />
      <nav aria-label="Навигация" className="flex items-center gap-2 text-[13.5px] font-semibold">
        <Link href="/" className="flex min-h-11 items-center gap-1 text-brand-ink hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Всички ваучери
        </Link>
        {hasCategoryPage ? (
          <>
            <span aria-hidden className="text-brand-quiet">/</span>
            <Link href={browsePath(category)} className="flex min-h-11 items-center text-brand-mint-deep hover:underline">
              {category.label}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-2 lg:mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_376px] lg:items-start lg:gap-8">
        <article>
          <div
            className="relative flex h-[170px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[22px] border-2 border-brand-ink lg:h-[292px]"
            style={{ backgroundColor: category.bg, color: onColor }}
          >
            {shop.cover_url ? (
              <Image src={shop.cover_url} alt="" fill priority sizes="(min-width: 1024px) 950px, 100vw" className="object-cover" />
            ) : (
              <>
                <Icon className="size-8 opacity-80" aria-hidden />
                <span className="font-num text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">{category.label}</span>
              </>
            )}
          </div>

          <div className="flex items-start gap-3.5 px-1 lg:gap-4 lg:px-7">
            <div className="relative -mt-9 flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border-2 border-brand-ink bg-brand-card lg:size-[96px]">
              {shop.logo_url ? (
                <Image src={shop.logo_url} alt={`Лого на ${name}`} fill sizes="96px" className="object-contain p-2" />
              ) : (
                <span className="font-display text-[30px] font-extrabold lg:text-[38px]" style={{ color: monogramColor }} aria-hidden>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 pt-2.5">
              <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-brand-ink lg:text-[30px]">
                {name}
              </h1>
              <span
                className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 font-ui text-[11px] font-extrabold uppercase tracking-[0.04em]"
                style={{ backgroundColor: category.bg, color: onColor }}
              >
                {category.label}
              </span>
            </div>
          </div>

          <p className="mt-5 max-w-[860px] text-[15px] leading-relaxed text-brand-body lg:text-[16px]">{description}</p>

          {hasVoucherText ? (
            <section aria-labelledby="voucher-heading" className="mt-6 max-w-[860px]">
              <h2 id="voucher-heading" className="font-display text-[17px] font-bold tracking-[-0.01em] text-brand-ink lg:text-[19px]">
                За ваучера
              </h2>
              {/* Our own text, shown whole; bold, italic and lists from the
                  admin's simple format, rendered as elements, never HTML. */}
              <RichText source={shop.voucher_description} className="mt-3 text-[15px] leading-relaxed text-brand-body lg:text-[16px]" />
            </section>
          ) : null}

          {factList.length ? (
            <ul className="mt-5 grid gap-2.5 lg:mt-6 lg:grid-cols-3 lg:gap-4">
              {factList.map((f) => (
                <li
                  key={f.title}
                  className="flex items-center gap-3 text-[14px] lg:flex-col lg:items-start lg:gap-0 lg:rounded-[16px] lg:border-2 lg:border-brand-ink lg:bg-brand-card lg:p-4"
                >
                  <f.icon className="size-[18px] shrink-0 text-brand-mint-deep lg:mb-4" aria-hidden />
                  <span className="font-bold text-brand-ink">{f.title}</span>
                  <span className="text-brand-body lg:text-[12.5px]">
                    <span className="lg:hidden"> · </span>
                    {f.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {offer?.terms_url ? (
            <p className="mt-4 text-[13.5px]">
              <a href={offer.terms_url} target="_blank" rel="nofollow noopener noreferrer" className="font-bold text-brand-mint-deep hover:underline">
                Условия на ваучера в {shop.domain}
              </a>
            </p>
          ) : null}
        </article>

        <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:rounded-[22px] lg:border-2 lg:border-brand-ink lg:bg-brand-card lg:p-6" aria-label="Купи ваучер">
          {amounts.length || customRange ? (
            <section aria-labelledby="amounts-heading">
              <h2 id="amounts-heading" className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink lg:text-[15px]">
                Суми
              </h2>
              {/* Facts only: the amount is chosen on the shop's own page. */}
              {amounts.length ? (
                <ul className="mt-3 flex flex-wrap gap-2 font-num text-[14px] font-semibold text-brand-ink">
                  {amounts.map((eur) => (
                    <li key={eur} className="rounded-[12px] border-2 border-brand-ink bg-brand-card px-3 py-1.5">
                      {formatEur(eur)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {customRange ? (
                <p className="mt-3 text-[14px] text-brand-body">
                  <span className="font-bold text-brand-ink">Сума по избор</span>
                  {customRange.min || customRange.max ? (
                    <span className="font-num font-semibold text-brand-ink">
                      {" · "}
                      {customRange.min && customRange.max
                        ? formatEurRange(customRange.min, customRange.max)
                        : customRange.min
                          ? `от ${formatEur(customRange.min)}`
                          : `до ${formatEur(customRange.max ?? 0)}`}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </section>
          ) : null}

          {canBuy ? (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-brand-ink bg-brand-ground px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-5 lg:border-t-2 lg:border-brand-hair lg:bg-transparent lg:p-0 lg:pt-5">
              <a
                href={outboundHref(shop.slug)}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-brand-ink bg-brand-amber px-4 font-ui text-[16px] font-extrabold text-brand-ink"
              >
                Купи от {shop.domain}
                <ArrowUpRight className="size-[18px] shrink-0" aria-hidden />
                <span className="sr-only">(отваря се в нов раздел)</span>
              </a>
            </div>
          ) : null}
          {lastChecked ? (
            <p className="mt-4 font-num text-[11.5px] text-brand-quiet">
              Обновено: {checkedDate(lastChecked)}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
