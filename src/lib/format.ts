import { BGN_PER_EUR } from "@/lib/domain";

const number = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 });

export function toBgn(value: number | null, currency: string | null) {
  if (value == null) return null;
  const code = (currency ?? "BGN").toUpperCase();
  if (code === "BGN") return value;
  if (code === "EUR") return value * BGN_PER_EUR;
  return null;
}

function range(min: number, max: number, suffix: string) {
  return min === max
    ? `${number.format(min)} ${suffix}`
    : `${number.format(min)}–${number.format(max)} ${suffix}`;
}

export function formatBgnRange(min: number, max: number) {
  return range(min, max, "лв");
}

export function formatEurRange(minBgn: number, maxBgn: number) {
  return range(minBgn / BGN_PER_EUR, maxBgn / BGN_PER_EUR, "€");
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
