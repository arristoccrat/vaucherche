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

export type ExistingCover = { url: string; name: string; shops: number };

// Covers shops already have (shops.cover_url) that are not in the library
// yet, one per URL, named after the first shop that uses it. Only our own
// storage copies. Read in pages of 1000.
export async function findExistingCovers(): Promise<ExistingCover[]> {
  await requireUser();
  const supabase = createAdminClient();
  const { data: library, error: libraryError } = await supabase.from("cover_library").select("url").range(0, 9999);
  if (libraryError) {
    if (isMissingTable(libraryError)) return [];
    throw new Error(libraryError.message);
  }
  const inLibrary = new Set(library.map((row) => row.url));
  const found = new Map<string, ExistingCover>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("shops")
      .select("cover_url, name, domain")
      .not("cover_url", "is", null)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data) {
      const url = row.cover_url;
      if (!url || inLibrary.has(url) || !url.includes("/storage/v1/object/public/shop-media/")) continue;
      const seen = found.get(url);
      if (seen) seen.shops += 1;
      else found.set(url, { url, name: (row.name?.trim() || row.domain || "Корица").slice(0, 80), shops: 1 });
    }
    if (data.length < 1000) break;
  }
  return Array.from(found.values()).sort((a, b) => b.shops - a.shops || a.name.localeCompare(b.name, "bg"));
}
