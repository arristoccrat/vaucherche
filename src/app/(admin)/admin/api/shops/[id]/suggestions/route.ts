import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestFromCrawl, type CrawlSuggestions } from "@/lib/suggestions";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

// Name / logo / cover suggestions from what the crawler stored for one shop.
// Loaded on demand from the editorial block, never with the list.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Не сте влезли." }, { status: 401, headers: noStore });
  }
  if (!z.guid().safeParse(params.id).success) {
    return NextResponse.json({ error: "Невалиден идентификатор." }, { status: 400, headers: noStore });
  }

  const supabase = createClient();
  const [shop, products, offers] = await Promise.all([
    supabase.from("shops").select("domain").eq("id", params.id).maybeSingle(),
    supabase
      .from("voucher_products")
      .select("url, title, image_url, meta, links")
      .eq("shop_id", params.id)
      .limit(50),
    supabase.from("voucher_offers").select("raw_extract").eq("shop_id", params.id).limit(5),
  ]);

  const error = shop.error ?? products.error ?? offers.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  if (!shop.data) {
    return NextResponse.json({ error: "Магазинът не е намерен." }, { status: 404, headers: noStore });
  }

  const body: CrawlSuggestions = suggestFromCrawl(
    shop.data.domain,
    products.data ?? [],
    (offers.data ?? []).map((o) => o.raw_extract)
  );
  return NextResponse.json(body, { headers: noStore });
}
