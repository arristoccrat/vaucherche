import type { MetadataRoute } from "next";

import { publishedShopSlugs } from "@/app/(public)/_lib/browse";
import { getVisibleCategories } from "@/app/(public)/_lib/categories";
import { browsePath } from "@/app/(public)/_lib/browse-params";
import { SITE_URL, isSiteLaunched } from "@/lib/site";

// Built per request (the shop list is a cached fetch), so the build needs no
// database. Before launch the public URLs all show /coming-soon, so the
// sitemap stays empty.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteLaunched()) return [];
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const [shops, { visible }] = await Promise.all([publishedShopSlugs(), getVisibleCategories()]);
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/kategorii"), changeFrequency: "weekly", priority: 0.6 },
    ...visible.map((category) => ({ url: url(browsePath(category)), changeFrequency: "daily" as const, priority: 0.8 })),
    ...shops.map((shop) => ({
      url: url(`/magazin/${shop.slug}`),
      lastModified: shop.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
