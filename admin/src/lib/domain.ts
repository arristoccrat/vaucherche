// Values the pipeline writes into text columns. Use these unions everywhere:
// they drive filter chips, badge colours and bulk rules, and a typo in a bare
// string literal would otherwise fail silently.

export const SHOP_STATUSES = [
  "candidate",
  "confirmed",
  "ai_confirmed",
  "needs_review",
  "rejected",
  "unreachable",
] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];

// Enum in the 06-categorise.js prompt; NULL means not yet categorised.
export const GIFT_APPEALS = ["high", "medium", "low"] as const;
export type GiftAppeal = (typeof GIFT_APPEALS)[number];

export const PRODUCT_SOURCES = ["og", "jsonld", "text", "manual"] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

export const STATUS_LABELS: Record<ShopStatus, string> = {
  candidate: "Кандидат",
  confirmed: "Потвърден",
  ai_confirmed: "Потвърден от AI",
  needs_review: "За преглед",
  rejected: "Отхвърлен",
  unreachable: "Недостъпен",
};

export const GIFT_APPEAL_LABELS: Record<GiftAppeal, string> = {
  high: "Висока",
  medium: "Средна",
  low: "Ниска",
};

// Fixed BGN/EUR conversion rate.
export const BGN_PER_EUR = 1.95583;

export function isShopStatus(value: unknown): value is ShopStatus {
  return SHOP_STATUSES.includes(value as ShopStatus);
}

export function isGiftAppeal(value: unknown): value is GiftAppeal {
  return GIFT_APPEALS.includes(value as GiftAppeal);
}
