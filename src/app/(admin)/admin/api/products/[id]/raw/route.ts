import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/auth";
import { PRODUCT_RAW_COLUMNS, type ProductRaw } from "@/lib/product-raw";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Не сте влезли." }, { status: 401, headers: noStore });
  }
  if (!z.guid().safeParse(params.id).success) {
    return NextResponse.json({ error: "Невалиден идентификатор." }, { status: 400, headers: noStore });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("voucher_products")
    .select(PRODUCT_RAW_COLUMNS)
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  }
  if (!data) {
    return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404, headers: noStore });
  }

  const body: ProductRaw = data;
  return NextResponse.json(body, { headers: noStore });
}
