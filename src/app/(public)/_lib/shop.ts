import { cache } from "react";

import { productEur, toEur } from "@/lib/format";
import { publicClient } from "@/lib/supabase/public";

// Everything the shop page shows, in one request: the shop, its preferred
// offer (a human-corrected one first, then the newest extraction) and its
// product rows for the amounts. Heavy product columns stay out.
const SHOP_SELECT = `id, slug, name, domain, description, logo_url, cover_url, category, subcategory, voucher_url, updated_at,
  voucher_offers(is_digital, is_physical, custom_amount, validity_months, personalisable, terms_url, currency, denominations, min_value, max_value, verified_at, human_edited_at, extracted_at),
  voucher_products(url, price, currency, price_bgn, fetched_at)`;

// Merchant URLs are crawled data: only plain http(s) links reach an href.
export function externalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// cache(): generateMetadata and the page share one fetch per request.
export const getPublishedShop = cache(async (slug: string) => {
  const { data, error } = await publicClient()
    .from("shops")
    .select(SHOP_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .order("human_edited_at", { referencedTable: "voucher_offers", ascending: false, nullsFirst: false })
    .order("extracted_at", { referencedTable: "voucher_offers", ascending: false, nullsFirst: false })
    .limit(1, { referencedTable: "voucher_offers" })
    .order("price_bgn", { referencedTable: "voucher_products", ascending: true })
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { voucher_offers, voucher_products, ...shop } = data;
  const offer = voucher_offers[0] ?? null;

  // The amounts the shop sells, shown as plain facts: the product prices in
  // euros (same rule as shop_voucher_range), or else the offer's own
  // denominations (crawled, or entered in the admin).
  const cents = (value: number) => Math.round(value * 100) / 100;
  const offerEur = (value: number | null) => {
    const eur = toEur(value, offer?.currency ?? "BGN");
    return eur != null && eur > 0 ? cents(eur) : null;
  };
  const fromProducts = voucher_products.map((p) => productEur(p)).filter((v): v is number => v != null && v > 0).map(cents);
  const fromOffer = (offer?.denominations ?? []).map(offerEur).filter((v): v is number => v != null);
  const amounts = Array.from(new Set(fromProducts.length ? fromProducts : fromOffer)).sort((a, b) => a - b);
  // "Сума по избор", with its limits when the offer has them.
  const customRange = offer?.custom_amount
    ? { min: offerEur(offer.min_value), max: offerEur(offer.max_value) }
    : null;
  // Where /out goes when the shop has no verified voucher page.
  const firstProductUrl = voucher_products.map((p) => externalUrl(p.url)).find(Boolean) ?? null;

  // "Last checked": the newest of the offer check and the product fetches.
  const checks = [offer?.verified_at, offer?.human_edited_at, offer?.extracted_at, ...voucher_products.map((p) => p.fetched_at)]
    .filter((d): d is string => Boolean(d))
    .sort();
  const lastChecked = checks.at(-1) ?? shop.updated_at;

  return {
    shop: { ...shop, voucher_url: externalUrl(shop.voucher_url) },
    offer: offer && { ...offer, terms_url: externalUrl(offer.terms_url) },
    amounts,
    customRange,
    firstProductUrl,
    lastChecked,
  };
});

export type PublishedShop = NonNullable<Awaited<ReturnType<typeof getPublishedShop>>>;
