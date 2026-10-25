import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { categoryByPath } from "@/lib/categories";

import { BrowseView } from "../../_components/browse-view";
import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { browsePath, canonicalBrowseUrl, parseBrowseFilters } from "../../_lib/browse-params";

type Props = {
  params: { path: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateMetadata({ params, searchParams }: Props): Metadata {
  const category = categoryByPath(params.path);
  if (!category) return {};
  const title = `${category.label}: подаръчни ваучери | vaucherche`;
  const description = `Подаръчни ваучери в категория „${category.label}“ от български онлайн магазини: суми в евро, валидност и начин на доставка.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalBrowseUrl({ ...parseBrowseFilters(searchParams), kategoriya: category.key }) },
    openGraph: { title, description, type: "website", locale: "bg_BG" },
  };
}

export default function CategoryPage({ params, searchParams }: Props) {
  const category = categoryByPath(params.path);
  if (!category) notFound();
  // The path is the category; a stray ?kategoriya= cannot override it.
  const filters = { ...parseBrowseFilters(searchParams), kategoriya: category.key };
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          { name: category.label, path: browsePath(category.key) },
        ]}
      />
      <BrowseView filters={filters} />
    </>
  );
}
