import { ChevronLeft, Clock, CreditCard, Gift, Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategory, onColorHex } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { formatEurRange } from "@/lib/format";

import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { browsePath } from "../../_lib/browse-params";
import { getPublishedShop, type PublishedShop } from "../../_lib/shop";

import { BuyPanel } from "./buy-panel";

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
  const range = amounts.length ? ` за ${formatEurRange(amounts[0].eur, amounts[amounts.length - 1].eur)}` : "";
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
  if (offer.validity_months) {
    list.push({ icon: Clock, title: `${offer.validity_months} ${offer.validity_months === 1 ? "месец" : "месеца"}`, detail: "валидност" });
  }
  if (offer.personalisable) list.push({ icon: Gift, title: "Персонализиран", detail: "с име или поздрав за подарения" });
  return list;
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getPublishedShop(params.slug);
  if (!data) notFound();
  const { shop, offer, amounts, lastChecked } = data;

  const category = getCategory(shop.category);
  const Icon = CATEGORY_ICONS[category.key];
  const onColor = onColorHex(category.on);
  const monogramColor = category.on === "ink" ? onColorHex("ink") : category.bg;
  const name = displayName(shop);
  const description = shop.description?.trim() || fallbackDescription(data);
  const factList = facts(data);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-3 lg:px-10 lg:pb-16 lg:pt-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          { name: category.label, path: browsePath(category.key) },
          { name, path: `/magazin/${shop.slug}` },
        ]}
      />
      <nav aria-label="Навигация" className="flex items-center gap-2 text-[13.5px] font-semibold">
        <Link href="/" className="flex min-h-11 items-center gap-1 text-brand-ink hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Всички ваучери
        </Link>
        <span aria-hidden className="text-brand-quiet">/</span>
        <Link href={browsePath(category.key)} className="flex min-h-11 items-center text-brand-mint-deep hover:underline">
          {category.label}
        </Link>
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

          <p className="mt-5 max-w-[660px] text-[15px] leading-relaxed text-brand-body lg:text-[16px]">{description}</p>

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
          <BuyPanel
            slug={shop.slug}
            amounts={amounts.map((a) => a.eur)}
            customAmount={Boolean(offer?.custom_amount)}
            canBuy={Boolean(shop.voucher_url || amounts.length)}
            domain={shop.domain}
          />
          <p className="mt-4 text-center text-[12.5px] leading-snug text-brand-body">
            Не продаваме ваучери — пращаме те директно на магазина.
            {lastChecked ? (
              <span className="mt-0.5 block font-num text-[11.5px] text-brand-quiet">
                Последна проверка: {checkedDate(lastChecked)}
              </span>
            ) : null}
          </p>
        </aside>
      </div>
    </div>
  );
}
