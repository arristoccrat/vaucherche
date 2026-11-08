import { notFound, permanentRedirect } from "next/navigation";

import { browsePath } from "../../_lib/browse-params";
import { resolveCategoryPath } from "../../_lib/categories";

// The existence check lives here, not in the page: the page streams behind
// loading.tsx, and by then the 200 status is already sent, so a 404 or a
// redirect from the page would reach crawlers as a 200.
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { path: string };
}) {
  const { category, movedTo } = await resolveCategoryPath(params.path);
  // The category's URL was changed in the admin: old links go to the new one.
  // (A layout has no query string, so filters on an old link are dropped.)
  if (movedTo) permanentRedirect(browsePath(movedTo));
  if (!category) notFound();
  return children;
}
