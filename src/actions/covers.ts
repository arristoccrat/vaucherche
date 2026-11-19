"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { MAX_IMAGE_BYTES } from "@/lib/images";
import { storeMediaBytes } from "@/lib/media-store";
import { PUBLIC_DATA_TAG } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

// The cover library (sql/017, /admin/covers): upload once with a name, then
// pick it for any shop. Picking writes the URL to shops.cover_url, so the
// public site is unchanged.

const fail = (error: string): ActionResult<never> => ({ ok: false, error });
const nameSchema = z.string().trim().min(1, { message: "Дай име на корицата." }).max(80, { message: "Името е до 80 знака." });

function refreshLibrary() {
  revalidatePath("/admin/covers");
  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
}

export async function uploadLibraryCover(formData: FormData): Promise<ActionResult<{ id: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const name = nameSchema.safeParse(formData.get("name"));
  const file = formData.get("file");
  if (!name.success) return fail(name.error.issues[0]?.message ?? "Невалидно име.");
  if (!(file instanceof File)) return fail("Избери файл.");
  if (file.size > MAX_IMAGE_BYTES) return fail("Файлът е над 2 MB.");

  const stored = await storeMediaBytes("covers/library", 2000, new Uint8Array(await file.arrayBuffer()));
  if (!stored.ok) return stored;

  const { data, error } = await createAdminClient()
    .from("cover_library")
    .insert({ name: name.data, url: stored.data.url })
    .select("id")
    .single();
  if (error) return fail(`Грешка при запис: ${error.message}`);
  refreshLibrary();
  return { ok: true, data: { id: data.id } };
}

export async function renameLibraryCover(id: string, name: string): Promise<ActionResult<null>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsedId = z.guid().safeParse(id);
  const parsedName = nameSchema.safeParse(name);
  if (!parsedId.success) return fail("Невалидни данни.");
  if (!parsedName.success) return fail(parsedName.error.issues[0]?.message ?? "Невалидно име.");
  const { error } = await createAdminClient().from("cover_library").update({ name: parsedName.data }).eq("id", parsedId.data);
  if (error) return fail(`Грешка при запис: ${error.message}`);
  refreshLibrary();
  return { ok: true, data: null };
}

// "Delete" archives (never DELETE): the cover leaves the list, shops that
// use it keep it. Restoring puts it back.
export async function setLibraryCoverArchived(id: string, archived: boolean): Promise<ActionResult<null>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ id: z.guid(), archived: z.boolean() }).safeParse({ id, archived });
  if (!parsed.success) return fail("Невалидни данни.");
  const { error } = await createAdminClient()
    .from("cover_library")
    .update({ archived_at: parsed.data.archived ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);
  if (error) return fail(`Грешка при запис: ${error.message}`);
  refreshLibrary();
  return { ok: true, data: null };
}

// Give a shop a cover from the library. The URL is looked up here, never
// taken from the browser.
export async function applyLibraryCover(shopId: string, coverId: string): Promise<ActionResult<{ url: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ shopId: z.guid(), coverId: z.guid() }).safeParse({ shopId, coverId });
  if (!parsed.success) return fail("Невалидни данни.");
  const supabase = createAdminClient();
  const { data: cover, error: readError } = await supabase
    .from("cover_library")
    .select("url")
    .eq("id", parsed.data.coverId)
    .is("archived_at", null)
    .maybeSingle();
  if (readError) return fail(`Грешка: ${readError.message}`);
  if (!cover) return fail("Корицата не е в библиотеката.");

  const { error } = await supabase
    .from("shops")
    .update({ cover_url: cover.url, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.shopId);
  if (error) return fail(`Грешка при запис: ${error.message}`);

  revalidateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
  revalidatePath(`/admin/shops/${parsed.data.shopId}`);
  revalidatePath("/admin/covers");
  return { ok: true, data: { url: cover.url } };
}
