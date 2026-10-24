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
  if (!user) redirect("/login");
  return user;
}

// Only allow redirects to paths on this site.
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/shops";
  return next;
}
