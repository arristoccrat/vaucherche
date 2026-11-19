import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findCity, inCity } from "@/lib/cities";

import { BrowseView } from "../../_components/browse-view";
import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { canonicalBrowseUrl, cityPath, parseBrowseFilters } from "../../_lib/browse-params";
import { getVisibleCities } from "../../_lib/categories";

type Props = {
  params: { city: string };
  searchParams: Record<string, string | string[] | undefined>;
};

async function visibleCity(key: string) {
  const cities = await getVisibleCities();
  const visible = cities.find((c) => c.key === key);
  const city = visible && findCity(visible.key);
  return city ? { ...city, count: visible.count } : undefined;
}

// /grad/plovdiv: the shops tied to one city ("Само в Пловдив"), for people
// who search "ваучер за подарък Пловдив". layout.tsx returns the 404.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = await visibleCity(params.city);
  if (!city) return {};
  const where = inCity(city.label);
  const title = `Подаръчни ваучери ${where}`;
  const description = `Ваучери за подарък от магазини, ресторанти, спа и места за преживявания ${where}: суми в евро, срок на валидност и как се получават.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalBrowseUrl({ ...parseBrowseFilters(searchParams), kategorii: [], grad: [city.key] }) },
    openGraph: { title, description, type: "website", locale: "bg_BG" },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const city = await visibleCity(params.city);
  if (!city) notFound();
  // The path is the city; categories and other cities go to their own
  // pages or the home list.
  const filters = { ...parseBrowseFilters(searchParams), kategorii: [], grad: [city.key] };
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          { name: city.label, path: cityPath(city.key) },
        ]}
      />
      <BrowseView filters={filters} />
    </>
  );
}
