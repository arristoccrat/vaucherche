import { cache } from "react";

import { productEur } from "@/lib/format";
import { publicClient } from "@/lib/supabase/public";

// Everything the shop page shows, in one request: the shop, its preferred
// offer (a human-corrected one first, then the newest extraction) and its
// product rows for the amount picker. Heavy product columns stay out.
const SHOP_SELECT = `id, slug, name, domain, description, logo_url, cover_url, category, subcategory, voucher_url, updated_at,
  voucher_offers(is_digital, is_physical, custom_amount, validity_months, personalisable, terms_url, verified_at, human_edited_at, extracted_at),
  voucher_products(url, price, currency, price_bgn, fetched_at)`;

export type ShopAmount = { eur: number; url: string };

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

  // One button per distinct euro amount (same rule as shop_voucher_range,
  // rounded to cents), each pointing at the product page that sells it.
  const byAmount = new Map<number, string>();
  for (const product of voucher_products) {
    const eur = productEur(product);
    const url = externalUrl(product.url);
    if (eur == null || eur <= 0 || !url) continue;
    const rounded = Math.round(eur * 100) / 100;
    if (!byAmount.has(rounded)) byAmount.set(rounded, url);
  }
  const amounts: ShopAmount[] = Array.from(byAmount, ([eur, url]) => ({ eur, url })).sort((a, b) => a.eur - b.eur);

  // "Last checked": the newest of the offer check and the product fetches.
  const checks = [offer?.verified_at, offer?.human_edited_at, offer?.extracted_at, ...voucher_products.map((p) => p.fetched_at)]
    .filter((d): d is string => Boolean(d))
    .sort();
  const lastChecked = checks.at(-1) ?? shop.updated_at;

  return {
    shop: { ...shop, voucher_url: externalUrl(shop.voucher_url) },
    offer: offer && { ...offer, terms_url: externalUrl(offer.terms_url) },
    amounts,
    lastChecked,
  };
});

export type PublishedShop = NonNullable<Awaited<ReturnType<typeof getPublishedShop>>>;
