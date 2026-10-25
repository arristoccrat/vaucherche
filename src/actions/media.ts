"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { PUBLIC_DATA_TAG } from "@/lib/site";
import { MAX_IMAGE_BYTES, isSafeRemoteUrl, sniffImage } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "shop-media";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

const kindSchema = z.enum(["logo", "cover"]);
type ImageKind = z.infer<typeof kindSchema>;

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

function refresh(shopId: string) {
  revalidateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
  revalidatePath(`/admin/shops/${shopId}`);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function imagePatch(kind: ImageKind, url: string | null) {
  const updated_at = new Date().toISOString();
  return kind === "logo" ? { logo_url: url, updated_at } : { cover_url: url, updated_at };
}

// Store bytes in the shop-media bucket and point the shop at the copy, so the
// site never hotlinks merchant images.
async function storeImage(
  shopId: string,
  kind: ImageKind,
  bytes: Uint8Array
): Promise<ActionResult<{ url: string }>> {
  if (bytes.byteLength > MAX_IMAGE_BYTES) return fail("Файлът е над 2 MB.");
  const type = sniffImage(bytes);
  if (!type) return fail("Неподдържан формат. Позволени са PNG, JPEG, WebP, GIF и ICO.");

  const supabase = createAdminClient();
  const path = `shops/${shopId}/${kind}-${Date.now()}.${type.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, toArrayBuffer(bytes), {
      contentType: type.mime,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) return fail(`Грешка при качване: ${uploadError.message}`);

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from("shops")
    .update(imagePatch(kind, url))
    .eq("id", shopId);
  if (error) return fail(`Грешка при запис: ${error.message}`);

  refresh(shopId);
  return { ok: true, data: { url } };
}

export async function uploadShopImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z
    .object({ shopId: z.guid(), kind: kindSchema })
    .safeParse({ shopId: formData.get("shopId"), kind: formData.get("kind") });
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File)) return fail("Невалидни данни.");
  if (file.size > MAX_IMAGE_BYTES) return fail("Файлът е над 2 MB.");

  return storeImage(parsed.data.shopId, parsed.data.kind, new Uint8Array(await file.arrayBuffer()));
}

// Fetch a public image URL (e.g. a crawl suggestion) and store a copy.
// Redirects are followed by hand so every hop is re-checked.
async function fetchImage(url: string): Promise<Uint8Array | string> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafeRemoteUrl(current)) return "Адресът не е позволен.";
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: "image/*" },
      });
    } catch {
      return "Изображението не можа да се изтегли.";
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return "Невалидно пренасочване.";
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok || !response.body) return `Сървърът върна ${response.status}.`;

    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_IMAGE_BYTES) return "Изображението е над 2 MB.";

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return "Изображението е над 2 MB.";
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  }
  return "Твърде много пренасочвания.";
}

export async function importShopImage(
  shopId: string,
  kind: ImageKind,
  url: string
): Promise<ActionResult<{ url: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z
    .object({ shopId: z.guid(), kind: kindSchema, url: z.string().trim().max(2000) })
    .safeParse({ shopId, kind, url });
  if (!parsed.success) return fail("Невалидни данни.");

  const result = await fetchImage(parsed.data.url);
  if (typeof result === "string") return fail(result);
  return storeImage(parsed.data.shopId, parsed.data.kind, result);
}

// Clears the field only; the stored file is left in place.
export async function clearShopImage(shopId: string, kind: ImageKind): Promise<ActionResult<null>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ shopId: z.guid(), kind: kindSchema }).safeParse({ shopId, kind });
  if (!parsed.success) return fail("Невалидни данни.");

  const { error } = await createAdminClient()
    .from("shops")
    .update(imagePatch(parsed.data.kind, null))
    .eq("id", parsed.data.shopId);
  if (error) return fail(`Грешка при запис: ${error.message}`);

  refresh(parsed.data.shopId);
  return { ok: true, data: null };
}
