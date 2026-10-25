import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { PUBLIC_DATA_TAG, PUBLIC_REVALIDATE_SECONDS } from "@/lib/site";

let client: SupabaseClient<Database> | null = null;

// The public site's only Supabase client: publishable key, no session, RLS
// limits it to published shops. Reads are cached for an hour under
// PUBLIC_DATA_TAG; admin writes revalidate the tag. Created on first use, so
// a build without the env vars fails at the query, not at module load.
export function publicClient() {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (in .env.local, or in Vercel for every environment)."
    );
  }
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_DATA_TAG] },
        }),
    },
  });
  return client;
}
