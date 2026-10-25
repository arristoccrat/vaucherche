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
