"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export type SignInState = ActionResult<never> | null;

// Email + password. Users are created in the Supabase dashboard; sign-ups are
// disabled, so there is no registration path here.
export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Въведете имейл и парола." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Same message for unknown email and wrong password.
    return {
      ok: false,
      error:
        error.status === 429
          ? "Твърде много опити. Изчакайте малко и опитайте пак."
          : "Грешен имейл или парола.",
    };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
