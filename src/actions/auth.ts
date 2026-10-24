"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const magicLinkSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

export type MagicLinkState = ActionResult<{ email: string }> | null;

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Въведете валиден имейл адрес." };
  }

  const { email, next } = parsed.data;
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const callback = new URL("/admin/auth/callback", `${protocol}://${host}`);
  callback.searchParams.set("next", safeNextPath(next));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Signups are disabled: only existing users get a link.
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });

  if (error) {
    return {
      ok: false,
      error: "Не успяхме да изпратим линк. Проверете имейла и опитайте пак.",
    };
  }

  return { ok: true, data: { email } };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
