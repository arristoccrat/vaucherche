import "server-only";

import { unstable_cache } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
  CATEGORY_COLUMNS,
  DEFAULT_CATEGORIES,
  bySortOrder,
  categoryFromRow,
  isMissingTable,
  type Category,
} from "@/lib/categories";
import { createAdminClient } from "@/lib/supabase/admin";

// Every category edit revalidates this tag (src/actions/categories.ts).
export const CATEGORIES_TAG = "categories";

export type ArchivedCategory = Category & { archivedAt: string };

export type AdminCategories = {
  active: Category[];
  archived: ArchivedCategory[];
  // sql/007 has not been run: the 18 built-in categories, read-only.
  missingTable: boolean;
};

async function readCategories(): Promise<AdminCategories> {
  const { data, error } = await createAdminClient()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order")
    .order("label");
  if (isMissingTable(error)) return { active: [...DEFAULT_CATEGORIES], archived: [], missingTable: true };
  if (error) throw new Error(error.message);
  return {
    active: data.filter((row) => !row.archived_at).map(categoryFromRow).sort(bySortOrder),
    archived: data
      .filter((row) => row.archived_at)
      .map((row) => ({ ...categoryFromRow(row), archivedAt: row.archived_at as string })),
    missingTable: false,
  };
}

// Cached for everyone (unstable_cache cannot see the session cookie), so it
// uses the admin client behind requireUser().
const cachedCategories = unstable_cache(readCategories, ["admin-categories"], {
  revalidate: 600,
  tags: [CATEGORIES_TAG],
});

export async function getAdminCategories() {
  await requireUser();
  return cachedCategories();
}

// For Server Actions, after their own getUser() check: always fresh.
export async function readCategoriesUncached() {
  return readCategories();
}
