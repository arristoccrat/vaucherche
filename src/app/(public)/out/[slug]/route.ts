import { NextResponse, type NextRequest } from "next/server";

import { outboundUrl } from "../../_lib/outbound";
import { getPublishedShop } from "../../_lib/shop";

// Every "Купи от …" link goes through here: one place to add affiliate
// parameters or click counting later. Unknown or unpublished shops fall
// through to the shop page, which renders the 404.
// Older links carried ?suma=<eur>; it is ignored now.
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const data = await getPublishedShop(params.slug);
  const destination = data
    ? outboundUrl({ voucherUrl: data.shop.voucher_url, firstProductUrl: data.firstProductUrl })
    : null;

  const response = destination
    ? NextResponse.redirect(destination, 302)
    : NextResponse.redirect(new URL(`/magazin/${encodeURIComponent(params.slug)}`, request.url), 302);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
