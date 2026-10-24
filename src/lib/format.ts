import { BGN_PER_EUR } from "@/lib/domain";

const number = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 });

// All amounts are shown in euros. Stored values stay as scraped (price +
// currency, plus price_bgn as the sort key); conversion happens here.
export function toEur(value: number | null, currency: string | null) {
  if (value == null) return null;
  const code = (currency ?? "BGN").toUpperCase();
  if (code === "EUR") return value;
  if (code === "BGN") return value / BGN_PER_EUR;
  return null;
}

// A product's euro price: exact when it was scraped in euros, otherwise
// derived from price_bgn.
export function productEur(product: {
  price: number | null;
  currency: string | null;
  price_bgn: number | null;
}) {
  if (product.price != null && (product.currency ?? "").toUpperCase() === "EUR") {
    return product.price;
  }
  return product.price_bgn == null ? null : product.price_bgn / BGN_PER_EUR;
}

export function formatEur(value: number) {
  return `${number.format(value)} €`;
}

export function formatEurRange(min: number, max: number) {
  return min === max
    ? formatEur(min)
    : `${number.format(min)}–${number.format(max)} €`;
}

export function formatConfidence(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
}

export function formatCount(value: number) {
  return value.toLocaleString("bg-BG");
}

// `status_reason` looks like `AI confirmed (0.92): подаръчен ваучер 50 лв`.
// The part after the first colon is the evidence quote.
export function parseStatusReason(reason: string | null) {
  if (!reason) return { verdict: null, quote: null };
  const colon = reason.indexOf(":");
  if (colon === -1) return { verdict: reason.trim(), quote: null };
  return {
    verdict: reason.slice(0, colon).trim(),
    quote: reason.slice(colon + 1).trim() || null,
  };
}
