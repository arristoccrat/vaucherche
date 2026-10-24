import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// For pages and layouts: no user means back to the login screen.
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

// After sign-in, only allow redirects back into the admin.
export function safeNextPath(next: string | null | undefined) {
  if (!next || !/^\/admin(\/|\?|$)/.test(next)) return "/admin/shops";
  return next;
}
