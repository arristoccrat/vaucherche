// The shop page's button wording (shops.cta_kind, sql/010), set in the admin.
export const CTA_KINDS = [
  { key: "buy", label: "Купи от" },
  { key: "more", label: "Повече на" },
] as const;
export type CtaKind = (typeof CTA_KINDS)[number]["key"];

export function ctaLabel(kind: string | null | undefined, domain: string) {
  const prefix = CTA_KINDS.find((c) => c.key === kind)?.label ?? CTA_KINDS[0].label;
  return `${prefix} ${domain}`;
}
