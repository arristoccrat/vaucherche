"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { SHOP_FACETS_TAG } from "@/lib/queries/shops";
import { createAdminClient } from "@/lib/supabase/admin";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(60)
  .refine((value) => value === "" || /^[a-z0-9][a-z0-9_-]*$/.test(value), {
    message: "Само малки латински букви, цифри, „-“ и „_“.",
  })
  .transform((value) => value || null);

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (value === "") return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, { message: "Невалиден URL." })
  .transform((value) => value || null);

const editorialSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Името не може да е празно." }).max(120),
    description: optionalText(600),
    logo_url: httpUrl,
    category: slug,
    subcategory: slug,
    gift_appeal: slug,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: "Няма промени." });

export type EditorialField = keyof z.input<typeof editorialSchema>;
export type EditorialPatch = Partial<Record<EditorialField, string>>;

const FACET_FIELDS: EditorialField[] = ["category", "subcategory", "gift_appeal"];

// Autosaved one field at a time from the editorial block.
export async function updateShopEditorial(
  id: string,
  patch: EditorialPatch
): Promise<ActionResult<{ fields: EditorialField[] }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsedId = z.guid().safeParse(id);
  const parsed = editorialSchema.safeParse(patch);
  if (!parsedId.success) return { ok: false, error: "Невалидни данни." };
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shops")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: `Грешка при запис: ${error.message}` };

  const fields = Object.keys(parsed.data) as EditorialField[];
  revalidatePath("/shops");
  revalidatePath("/queue");
  revalidatePath(`/shops/${parsedId.data}`);
  if (fields.some((field) => FACET_FIELDS.includes(field))) {
    revalidateTag(SHOP_FACETS_TAG);
  }
  return { ok: true, data: { fields } };
}
