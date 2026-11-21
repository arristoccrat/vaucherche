import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrowseView } from "../../_components/browse-view";
import { BreadcrumbJsonLd } from "../../_components/json-ld";
import { browsePath, canonicalBrowseUrl, parseBrowseFilters, shopCountLabel } from "../../_lib/browse-params";
import { getCategoryContent, getVisibleCategories, resolveCategoryPath } from "../../_lib/categories";
import { CategoryFaq, CategoryIntro } from "../../_components/category-copy";

type Props = {
  params: { path: string };
  searchParams: Record<string, string | string[] | undefined>;
};

// A category page exists only while the category is active and has at least
// one published shop; layout.tsx returns the 404 or the redirect for others.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await resolveCategoryPath(params.path);
  if (!category) return {};
  const title = `${category.label} — подаръчни ваучери и карти за подарък`;
  // The editor's intro, as plain text, when there is one.
  const { intro } = await getCategoryContent(category.key);
  const introText = intro.replace(/\*\*?|^\s*(?:-|\d+\.)\s+/gm, "").replace(/\s+/g, " ").trim();
  const description = introText
    ? introText.length > 160
      ? `${introText.slice(0, 157).replace(/\s+\S*$/, "")}…`
      : introText
    : `Подаръчни ваучери в категория „${category.label}“ от български онлайн магазини: суми в евро, валидност и начин на доставка.`;
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
  const [content, { counts }] = await Promise.all([getCategoryContent(category.key), getVisibleCategories()]);
  // The copy belongs to the category's own page: its first page, with no
  // other filters in the way.
  const plain = filters.stranitsa === 1;
  const fallback = `${shopCountLabel(counts[category.key] ?? 0)} с подаръчни ваучери в категория „${category.label}“. Сравни суми, срок на валидност и как се получава ваучерът, после го купи директно от магазина.`;
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Всички ваучери", path: "/" },
          { name: category.label, path: browsePath(category) },
        ]}
      />
      <BrowseView
        filters={filters}
        intro={plain ? <CategoryIntro text={content.intro} fallback={fallback} /> : null}
        footer={plain ? <CategoryFaq items={content.faq} /> : null}
      />
    </>
  );
}
