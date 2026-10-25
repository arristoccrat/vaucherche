// Where /out/[slug] sends a visitor. The query only ever names an amount;
// the destination always comes from the database (already filtered to
// http/https by externalUrl), so the route cannot be used as an open
// redirect.

type Target = {
  amounts: { eur: number; url: string }[];
  voucherUrl: string | null;
};

export function parseAmount(raw: string | null) {
  if (!raw) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export function outboundUrl({ amounts, voucherUrl }: Target, amount: number | null) {
  const exact = amount === null ? undefined : amounts.find((a) => a.eur === amount);
  return exact?.url ?? voucherUrl ?? amounts[0]?.url ?? null;
}

export function outboundHref(slug: string, amount?: number | null) {
  const path = `/out/${encodeURIComponent(slug)}`;
  return amount ? `${path}?suma=${amount}` : path;
}
