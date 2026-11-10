"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { PUBLIC_DATA_TAG } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

const voucherUrl = z
  .string()
  .trim()
  .min(1, { message: "Въведете URL." })
  .max(2000, { message: "URL адресът е твърде дълъг." })
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, { message: "Невалиден URL." });

// The shop's voucher page, confirmed by a human: where "Купи от …" sends
// visitors (via /out). Products stay as the crawler found them; nothing is
// added or removed here.
export async function verifyVoucherUrl(
  shopId: string,
  url: string
): Promise<ActionResult<{ url: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const input = z.object({ shopId: z.guid(), url: voucherUrl }).safeParse({ shopId, url });
  if (!input.success) return { ok: false, error: input.error.issues[0]?.message ?? "Невалидни данни." };

  const { error } = await createAdminClient()
    .from("shops")
    .update({
      voucher_url: input.data.url,
      voucher_url_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.data.shopId);
  if (error) return { ok: false, error: `Грешка при запис: ${error.message}` };

  revalidatePath("/admin/shops");
  revalidateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/queue");
  revalidatePath(`/admin/shops/${input.data.shopId}`);
  return { ok: true, data: { url: input.data.url } };
}
