import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

// Service-role client: bypasses RLS. Use only inside Server Actions, after
// checking the user. `server-only` above turns an accidental import from a
// Client Component into a build error instead of a leaked key.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
