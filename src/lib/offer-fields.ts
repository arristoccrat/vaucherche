// Voucher-offer fields a person can correct in the admin.
export const OFFER_FIELDS = [
  "denominations",
  "min_value",
  "max_value",
  "custom_amount",
  "is_digital",
  "is_physical",
  "personalisable",
  "delivery_methods",
  "validity_months",
  "terms_url",
] as const;
export type OfferField = (typeof OFFER_FIELDS)[number];

// How the voucher reaches the buyer: the values the admin sets in
// `voucher_offers.delivery_methods`. The crawler wrote free words ("email",
// "courier", "in_store"); they are read as the closest option, and a save
// from the admin replaces them with these keys.
export const DELIVERY_OPTIONS = [
  { key: "digital", label: "Дигитално" },
  { key: "delivery", label: "Доставка" },
  { key: "in_store", label: "В магазин" },
] as const;
export type DeliveryKey = (typeof DELIVERY_OPTIONS)[number]["key"];

// The stored words each option stands for, lower case: its own key first,
// then what the crawler wrote.
export const DELIVERY_WORDS: Record<DeliveryKey, readonly string[]> = {
  digital: ["digital", "email", "e-mail", "имейл", "online", "pdf", "sms"],
  delivery: ["delivery", "courier", "post", "shipping", "mail", "куриер", "доставка", "поща"],
  in_store: ["in_store", "in-store", "instore", "store", "pickup", "shop", "магазин", "в магазин", "на място"],
};

export function deliveryKeys(methods: readonly string[] | null | undefined): DeliveryKey[] {
  const words = new Set((methods ?? []).map((m) => m.trim().toLowerCase()));
  return DELIVERY_OPTIONS.map((o) => o.key).filter((k) => DELIVERY_WORDS[k].some((w) => words.has(w)));
}
