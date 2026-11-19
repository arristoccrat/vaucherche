import "server-only";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type LibraryCover = { id: string; name: string; url: string; archivedAt: string | null };
export type CoverOption = Pick<LibraryCover, "id" | "name" | "url">;

const isMissingTable = (error: { code?: string; message?: string } | null) =>
  Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /cover_library/.test(error.message ?? "")));

// Every cover in the library (sql/017), active first by name; with how many
// shops use each. `missingTable` until 017 is run.
export async function getCoverLibrary(): Promise<{
  covers: (LibraryCover & { shops: number })[];
  missingTable: boolean;
}> {
  await requireUser();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cover_library")
    .select("id, name, url, archived_at")
    .order("name")
    .range(0, 999);
  if (isMissingTable(error)) return { covers: [], missingTable: true };
  if (error) throw new Error(error.message);
  const covers = await Promise.all(
    data.map(async (row) => {
      const { count } = await supabase.from("shops").select("id", { count: "exact", head: true }).eq("cover_url", row.url);
      return { id: row.id, name: row.name, url: row.url, archivedAt: row.archived_at, shops: count ?? 0 };
    })
  );
  covers.sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)) || a.name.localeCompare(b.name, "bg"));
  return { covers, missingTable: false };
}

// The covers a shop's cover can be picked from: active ones, by name.
export async function getCoverOptions(): Promise<CoverOption[]> {
  await requireUser();
  const { data, error } = await createAdminClient()
    .from("cover_library")
    .select("id, name, url")
    .is("archived_at", null)
    .order("name")
    .range(0, 999);
  if (isMissingTable(error)) return [];
  if (error) throw new Error(error.message);
  return data;
}
