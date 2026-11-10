// Where /out/[slug] sends a visitor: the shop's verified voucher page, or
// failing that its first product page. Both come from the database (already
// filtered to http/https by externalUrl); the route reads nothing from the
// query, so it cannot be used as an open redirect.

export function outboundUrl({ voucherUrl, firstProductUrl }: { voucherUrl: string | null; firstProductUrl: string | null }) {
  return voucherUrl ?? firstProductUrl ?? null;
}

export function outboundHref(slug: string) {
  return `/out/${encodeURIComponent(slug)}`;
}
