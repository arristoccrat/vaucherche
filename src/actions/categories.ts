"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { categoryInputSchema, nextPreviousPaths, type CategoryInput } from "@/lib/category-input";
import { CATEGORIES_TAG, readCategoriesUncached } from "@/lib/queries/categories";
import { SHOP_COUNTS_TAG, SHOP_FACETS_TAG } from "@/lib/queries/shops";
import { PUBLIC_DATA_TAG } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

// Categories are edited here and nowhere else. Keys never change (they are
// what shops.category stores); "delete" archives, so nothing is lost and a
// category can be restored.

const NO_TABLE: ActionResult<never> = {
  ok: false,
  error: "Таблицата с категории още не съществува: пусни sql/007_categories.sql в Supabase.",
};

const keySchema = z.string().trim().min(1).max(40);

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Невалидни данни.";
}

function failed(message: string): ActionResult<never> {
  return { ok: false, error: `Грешка при запис: ${message}` };
}

function refresh() {
  revalidateTag(CATEGORIES_TAG);
  revalidateTag(PUBLIC_DATA_TAG);
  revalidateTag(SHOP_FACETS_TAG);
  revalidateTag(SHOP_COUNTS_TAG);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
}

// A path must not belong to another category, now or as an old (redirecting)
// one, or the two would fight over the same URL.
async function pathTakenBy(path: string, exceptKey: string | null) {
  const { active, archived } = await readCategoriesUncached();
  return [...active, ...archived].find(
    (c) => c.key !== exceptKey && (c.path === path || c.previousPaths.includes(path))
  );
}

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ key: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { missingTable, active, archived } = await readCategoriesUncached();
  if (missingTable) return NO_TABLE;

  const { label, path, bg, on, icon } = parsed.data;
  const taken = await pathTakenBy(path, null);
  if (taken) return { ok: false, error: `Адресът „${path}“ вече е на категория „${taken.label}“.` };
  // The key is the first path and stays even if the path changes later.
  const key = path;
  if ([...active, ...archived].some((c) => c.key === key)) {
    return { ok: false, error: `Вече има категория с ключ „${key}“. Изберете друг адрес.` };
  }
  const sortOrder = Math.max(0, ...active.map((c) => c.sortOrder)) + 10;

  const { error } = await createAdminClient()
    .from("categories")
    .insert({ key, label, path, bg, on_color: on, icon, sort_order: sortOrder });
  if (error) return failed(error.message);
  refresh();
  return { ok: true, data: { key } };
}

export async function updateCategory(key: string, input: CategoryInput): Promise<ActionResult<{ key: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsedKey = keySchema.safeParse(key);
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsedKey.success) return { ok: false, error: "Невалидни данни." };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { missingTable, active, archived } = await readCategoriesUncached();
  if (missingTable) return NO_TABLE;

  const current = [...active, ...archived].find((c) => c.key === parsedKey.data);
  if (!current) return { ok: false, error: "Категорията не е намерена." };
  const { label, path, bg, on, icon } = parsed.data;
  if (path !== current.path) {
    const taken = await pathTakenBy(path, current.key);
    if (taken) return { ok: false, error: `Адресът „${path}“ вече е на категория „${taken.label}“.` };
  }

  const { error } = await createAdminClient()
    .from("categories")
    .update({
      label,
      path,
      previous_paths: nextPreviousPaths(current.previousPaths, current.path, path),
      bg,
      on_color: on,
      icon,
      updated_at: new Date().toISOString(),
    })
    .eq("key", current.key);
  if (error) return failed(error.message);
  refresh();
  return { ok: true, data: { key: current.key } };
}

// Up or down one place among the active categories (the order on the site).
export async function moveCategory(key: string, direction: "up" | "down"): Promise<ActionResult<null>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ key: keySchema, direction: z.enum(["up", "down"]) }).safeParse({ key, direction });
  if (!parsed.success) return { ok: false, error: "Невалидни данни." };
  const { missingTable, active } = await readCategoriesUncached();
  if (missingTable) return NO_TABLE;

  const index = active.findIndex((c) => c.key === parsed.data.key);
  const target = index + (parsed.data.direction === "up" ? -1 : 1);
  if (index === -1 || target < 0 || target >= active.length) return { ok: true, data: null };

  // Renumber the whole list in steps of 10 with the two swapped, so ties
  // from hand edits or the seed never block a move.
  const order = [...active];
  [order[index], order[target]] = [order[target], order[index]];
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  for (let i = 0; i < order.length; i++) {
    const category = order[i];
    const sortOrder = (i + 1) * 10;
    if (category.sortOrder === sortOrder) continue;
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: sortOrder, updated_at: now })
      .eq("key", category.key);
    if (error) return failed(error.message);
  }
  refresh();
  return { ok: true, data: null };
}

// "Delete": hide the category everywhere. Shops still in it must be moved
// to another active category first (moveTo), so none is left without one.
export async function archiveCategory(
  key: string,
  moveTo: string | null
): Promise<ActionResult<{ moved: number }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ key: keySchema, moveTo: keySchema.nullable() }).safeParse({ key, moveTo });
  if (!parsed.success) return { ok: false, error: "Невалидни данни." };
  const { missingTable, active } = await readCategoriesUncached();
  if (missingTable) return NO_TABLE;
  if (!active.some((c) => c.key === parsed.data.key)) return { ok: false, error: "Категорията не е активна." };

  const supabase = createAdminClient();
  const { count, error: countError } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("category", parsed.data.key);
  if (countError) return failed(countError.message);

  let moved = 0;
  if (count) {
    const target = parsed.data.moveTo;
    if (!target || target === parsed.data.key || !active.some((c) => c.key === target)) {
      return { ok: false, error: `В категорията има ${count} магазина: изберете къде да отидат.` };
    }
    const { data, error } = await supabase
      .from("shops")
      .update({ category: target, updated_at: new Date().toISOString() })
      .eq("category", parsed.data.key)
      .select("id");
    if (error) return failed(error.message);
    moved = data.length;
  }

  const { error } = await supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("key", parsed.data.key);
  if (error) return failed(error.message);
  refresh();
  return { ok: true, data: { moved } };
}

export async function restoreCategory(key: string): Promise<ActionResult<null>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsedKey = keySchema.safeParse(key);
  if (!parsedKey.success) return { ok: false, error: "Невалидни данни." };
  const { missingTable, active } = await readCategoriesUncached();
  if (missingTable) return NO_TABLE;

  const { error } = await createAdminClient()
    .from("categories")
    .update({
      archived_at: null,
      sort_order: Math.max(0, ...active.map((c) => c.sortOrder)) + 10,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsedKey.data);
  if (error) return failed(error.message);
  refresh();
  return { ok: true, data: null };
}
