import { BRAND } from "@/lib/brand";
import { onColorHex, tintHex } from "@/lib/categories";

import { shopCountLabel } from "../../_lib/browse-params";
import { getVisibleCategories, resolveCategoryPath } from "../../_lib/categories";
import { Initial, OG_CONTENT_TYPE, OG_SIZE, ogImage } from "../../_lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Подаръчни ваучери по категория във vaucherche";

// The share image of a category page: its initial on a gift card in its colour,
// its name and how many shops it has.
export default async function Image({ params }: { params: { path: string } }) {
  const [{ category }, { counts }] = await Promise.all([resolveCategoryPath(params.path), getVisibleCategories()]);
  if (!category) return ogImage({ title: "Подаръчни ваучери", subtitle: "от български магазини", wash: BRAND.card });
  const color = category.on === "ink" ? onColorHex("ink") : category.bg;
  return ogImage({
    title: category.label,
    subtitle: "Подаръчни ваучери и карти за подарък",
    chips: [shopCountLabel(counts[category.key] ?? 0)],
    wash: tintHex(category.bg),
    // The category's initial in its colour, like a shop card without a logo.
    mark: <Initial letter={category.label.charAt(0)} color={color} />,
  });
}
