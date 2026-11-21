import { BRAND } from "@/lib/brand";
import { categoryOrFallback, onColorHex, tintHex } from "@/lib/categories";
import { formatEur } from "@/lib/format";

import { getVisibleCategories } from "../../_lib/categories";
import { Initial, OG_CONTENT_TYPE, OG_SIZE, logoDataUri, ogImage } from "../../_lib/og";
import { getPublishedShop } from "../../_lib/shop";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Подаръчен ваучер във vaucherche";

// The share image of a shop page: its logo on a gift card, its name and the
// amounts it sells.
export default async function Image({ params }: { params: { slug: string } }) {
  const [data, { visible }] = await Promise.all([getPublishedShop(params.slug), getVisibleCategories()]);
  if (!data) {
    return ogImage({ title: "Подаръчни ваучери", subtitle: "от български магазини", wash: tintHex(BRAND.mint) });
  }
  const { shop, amounts, customRange } = data;
  const category = categoryOrFallback(visible, shop.category);
  const name = shop.name?.trim() || shop.domain;
  const chips = amounts.slice(0, 3).map((a) => formatEur(a));
  if (amounts.length > 3) chips.push(`+${amounts.length - 3}`);
  if (!chips.length && customRange) chips.push("Сума по избор");
  return ogImage({
    title: name,
    subtitle: "Подаръчен ваучер",
    tag: category.key ? { label: category.label, bg: category.bg, color: onColorHex(category.on) } : undefined,
    chips,
    wash: tintHex(category.bg),
    logo: await logoDataUri(shop.logo_url),
    logoBg: shop.logo_bg,
    mark: <Initial letter={name.charAt(0)} color={category.on === "ink" ? onColorHex("ink") : category.bg} />,
  });
}
