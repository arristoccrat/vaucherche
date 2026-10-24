"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_URLS = 50;

// One URL per line; the first is the shop's primary voucher page.
function parseUrlList(text: string): { urls: string[] } | { error: string } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const urls: string[] = [];
  for (const line of lines) {
    let parsed: URL;
    try {
      parsed = new URL(line);
    } catch {
      return { error: `Невалиден URL: ${line}` };
    }
    if (!["http:", "https:"].includes(parsed.protocol) || line.length > 2000) {
      return { error: `Невалиден URL: ${line}` };
    }
    // Keep the URL exactly as pasted so it matches what the crawler stores.
    if (!urls.includes(line)) urls.push(line);
  }

  if (!urls.length) return { error: "Въведете поне един URL." };
  if (urls.length > MAX_URLS) {
    return { error: `Най-много ${MAX_URLS} URL адреса наведнъж.` };
  }
  return { urls };
}

type VerifyResult = { primary: string; added: number; existing: number };

// Marks the first URL as the verified voucher page and seeds every URL as a
// `manual` product for the next crawl to price. Never touches existing
// products, so re-verifying cannot wipe prices the crawler already found.
export async function verifyVoucherUrls(
  shopId: string,
  text: string
): Promise<ActionResult<VerifyResult>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const input = z
    .object({ shopId: z.guid(), text: z.string().max(100_000) })
    .safeParse({ shopId, text });
  if (!input.success) return { ok: false, error: "Невалидни данни." };

  const parsed = parseUrlList(input.data.text);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const { urls } = parsed;

  const supabase = createAdminClient();
  try {
    const { data: existingRows, error: existingError } = await supabase
      .from("voucher_products")
      .select("url")
      .eq("shop_id", input.data.shopId)
      .in("url", urls);
    if (existingError) throw new Error(existingError.message);

    const existing = new Set(existingRows.map((row) => row.url));
    const missing = urls.filter((url) => !existing.has(url));

    if (missing.length) {
      const { error } = await supabase.from("voucher_products").insert(
        missing.map((url) => ({
          shop_id: input.data.shopId,
          url,
          source: "manual",
        }))
      );
      if (error?.code === "23505") {
        return {
          ok: false,
          error: "Някой от URL адресите вече е записан (възможно към друг магазин). Нищо не е променено.",
        };
      }
      if (error) throw new Error(error.message);
    }

    const { error: shopError } = await supabase
      .from("shops")
      .update({
        voucher_url: urls[0],
        voucher_url_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.data.shopId);
    if (shopError) throw new Error(shopError.message);

    revalidatePath("/shops");
    revalidatePath(`/shops/${input.data.shopId}`);
    return {
      ok: true,
      data: { primary: urls[0], added: missing.length, existing: existing.size },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Грешка при запис: ${message}` };
  }
}
