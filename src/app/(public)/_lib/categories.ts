import { cache } from "react";

import {
  CATEGORY_COLUMNS,
  DEFAULT_CATEGORIES,
  bySortOrder,
  categoryFromRow,
  findCategoryByPath,
  findCategoryByPreviousPath,
  isMissingTable,
  type Category,
} from "@/lib/categories";
import { publicClient } from "@/lib/supabase/public";

import { categoryCounts } from "./browse";

// Active categories in display order (RLS hides archived ones). Cached with
// every other public read; admin edits revalidate the tag.
export const getPublicCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await publicClient()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .is("archived_at", null)
    .order("sort_order")
    .order("label");
  if (isMissingTable(error)) return [...DEFAULT_CATEGORIES];
  if (error) throw new Error(error.message);
  return data.map(categoryFromRow).sort(bySortOrder);
});

// Categories the site shows: active and with at least one published shop.
export const getVisibleCategories = cache(async () => {
  const [categories, { counts, total }] = await Promise.all([getPublicCategories(), categoryCounts()]);
  const visible = categories.filter((c) => (counts[c.key] ?? 0) > 0);
  return { categories, visible, counts, total };
});

// /kategoriya/<path>: the category shown there (active, with published
// shops), or the category that used to live at that path (URL changed).
export async function resolveCategoryPath(path: string) {
  const { categories, visible } = await getVisibleCategories();
  return {
    category: findCategoryByPath(visible, path),
    movedTo: findCategoryByPath(categories, path) ? undefined : findCategoryByPreviousPath(categories, path),
  };
}
