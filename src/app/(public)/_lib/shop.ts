import { cache } from "react";

import { toEur } from "@/lib/format";
import { publicClient } from "@/lib/supabase/public";

// Everything the shop page shows, in one request: the shop, its preferred
// offer (a human-corrected one first, then the newest extraction) and its
// product rows (for the outbound fallback and the update date).
const SHOP_SELECT = `id, slug, name, domain, description, voucher_description, logo_url, cover_url, category, subcategory, voucher_url, cta_kind, updated_at,
  voucher_offers(is_digital, is_physical, delivery_methods, custom_amount, validity_months, personalisable, terms_url, currency, denominations, min_value, max_value, verified_at, human_edited_at, extracted_at),
  voucher_products(url, fetched_at)`;

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

  // The amounts the shop sells, shown as plain facts: the offer's
  // denominations ("Номинали" in the admin) in euros, the same values the
  // cards read from shop_voucher_range (sql/009).
  const cents = (value: number) => Math.round(value * 100) / 100;
  const offerEur = (value: number | null) => {
    const eur = toEur(value, offer?.currency ?? "BGN");
    return eur != null && eur > 0 ? cents(eur) : null;
  };
  const amounts = Array.from(
    new Set((offer?.denominations ?? []).map(offerEur).filter((v): v is number => v != null))
  ).sort((a, b) => a - b);
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
