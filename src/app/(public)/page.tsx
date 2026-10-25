import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { BrowseView } from "./_components/browse-view";
import { canonicalBrowseUrl, parseBrowseFilters, browseHref } from "./_lib/browse-params";

type Props = { searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ searchParams }: Props): Metadata {
  const filters = parseBrowseFilters(searchParams);
  // Next 14 strips the query from any canonical whose path is "/", so later
  // home pages cannot point at themselves: keep them out of the index and
  // let crawlers follow through to the shops (also in the sitemap).
  if (filters.stranitsa > 1) return { robots: { index: false, follow: true } };
  return { alternates: { canonical: canonicalBrowseUrl(filters) } };
}

export default function HomePage({ searchParams }: Props) {
  const filters = parseBrowseFilters(searchParams);
  // A category filter has its own page; old ?kategoriya= links land there.
  if (filters.kategoriya) permanentRedirect(browseHref(filters, { stranitsa: filters.stranitsa }));
  return <BrowseView filters={filters} />;
}
