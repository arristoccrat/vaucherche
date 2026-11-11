import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrowseView } from "../../_components/browse-view";
import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { browsePath, canonicalBrowseUrl, parseBrowseFilters } from "../../_lib/browse-params";
import { resolveCategoryPath } from "../../_lib/categories";

type Props = {
  params: { path: string };
  searchParams: Record<string, string | string[] | undefined>;
};

// A category page exists only while the category is active and has at least
// one published shop; layout.tsx returns the 404 or the redirect for others.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await resolveCategoryPath(params.path);
  if (!category) return {};
  const title = `${category.label}: подаръчни ваучери | vaucherche`;
  const description = `Подаръчни ваучери в категория „${category.label}“ от български онлайн магазини: суми в евро, валидност и начин на доставка.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalBrowseUrl({ ...parseBrowseFilters(searchParams), kategorii: [category] }) },
    openGraph: { title, description, type: "website", locale: "bg_BG" },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await resolveCategoryPath(params.path);
  if (!category) notFound();
  // The path is the category; a stray ?kategoriya= cannot override it
  // (several categories live on the home page).
  const filters = { ...parseBrowseFilters(searchParams), kategorii: [category] };
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          { name: category.label, path: browsePath(category) },
        ]}
      />
      <BrowseView filters={filters} />
    </>
  );
}
