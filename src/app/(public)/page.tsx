import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { BrowseView } from "./_components/browse-view";
import { canonicalBrowseUrl, parseBrowseFilters, browseHref } from "./_lib/browse-params";
import { getPublicCategories } from "./_lib/categories";

type Props = { searchParams: Record<string, string | string[] | undefined> };

// Depends on the query string; never prerendered, so the build needs no
// database (it reads the categories before the filters).
export const dynamic = "force-dynamic";

export function generateMetadata({ searchParams }: Props): Metadata {
  const filters = parseBrowseFilters(searchParams);
  // Next 14 strips the query from any canonical whose path is "/", so later
  // home pages cannot point at themselves: keep them out of the index and
  // let crawlers follow through to the shops (also in the sitemap).
  if (filters.stranitsa > 1) return { robots: { index: false, follow: true } };
  return { alternates: { canonical: canonicalBrowseUrl(filters) } };
}

export default async function HomePage({ searchParams }: Props) {
  const filters = parseBrowseFilters(searchParams, await getPublicCategories());
  // One category has its own page; ?kategoriya=<one key> lands there.
  // Several stay here as a list.
  if (filters.kategorii.length === 1) permanentRedirect(browseHref(filters, { stranitsa: filters.stranitsa }));
  return <BrowseView filters={filters} />;
}
