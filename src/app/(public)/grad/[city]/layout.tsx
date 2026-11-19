import { notFound } from "next/navigation";

import { getVisibleCities } from "../../_lib/categories";

// The existence check lives here, not in the page (see kategoriya/[path]):
// the page streams behind loading.tsx, so a 404 from it would reach
// crawlers as a 200. A city page exists while it has published shops.
export default async function CityLayout({ children, params }: { children: React.ReactNode; params: { city: string } }) {
  const cities = await getVisibleCities();
  if (!cities.some((c) => c.key === params.city)) notFound();
  return children;
}
