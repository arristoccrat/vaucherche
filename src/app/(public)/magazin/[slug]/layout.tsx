import { notFound } from "next/navigation";

import { getPublishedShop } from "../../_lib/shop";

// The 404 for unknown or unpublished shops is decided here, before the page
// streams behind loading.tsx (by then the 200 status is already sent).
// getPublishedShop is cached per request, so the page reuses this read.
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  if (!(await getPublishedShop(params.slug))) notFound();
  return children;
}
