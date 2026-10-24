import { createClient } from "@/lib/supabase/server";

// Phase 2 replaces this with the shops browser. For now it confirms that the
// session client reaches Supabase and that RLS lets a signed-in user see
// every shop.
export default async function ShopsPage() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Магазини</h1>
      {error ? (
        <p className="text-sm text-destructive">
          Грешка при четене от Supabase: {error.message}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Видими магазини: {count?.toLocaleString("bg-BG") ?? 0}
        </p>
      )}
    </div>
  );
}
