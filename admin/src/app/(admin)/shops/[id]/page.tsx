import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ShopPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, domain, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!shop) notFound();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{shop.name || shop.domain}</h1>
      <p className="text-sm text-muted-foreground">
        {shop.domain} · {shop.status}
      </p>
    </div>
  );
}
