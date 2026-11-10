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

// How the voucher reaches the buyer: the two values the admin sets in
// `voucher_offers.delivery_methods`. The crawler wrote free words ("email",
// "courier", "in_store"); they are read as the closest option, and a save
// from the admin replaces them with these keys.
export const DELIVERY_OPTIONS = [
  { key: "digital", label: "Дигитално" },
  { key: "delivery", label: "Доставка" },
] as const;
export type DeliveryKey = (typeof DELIVERY_OPTIONS)[number]["key"];

const DIGITAL_WORDS = /^(digital|email|e-mail|имейл|online|pdf|sms)$/i;
const DELIVERY_WORDS = /^(delivery|courier|post|shipping|mail|куриер|доставка|поща)$/i;

export function deliveryKeys(methods: readonly string[] | null | undefined): DeliveryKey[] {
  const keys = new Set<DeliveryKey>();
  for (const raw of methods ?? []) {
    const word = raw.trim();
    if (DIGITAL_WORDS.test(word)) keys.add("digital");
    else if (DELIVERY_WORDS.test(word)) keys.add("delivery");
  }
  return DELIVERY_OPTIONS.map((o) => o.key).filter((k) => keys.has(k));
}
