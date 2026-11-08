import type { ShopStatus } from "@/lib/domain";

export type PublishCheckInput = {
  status: string;
  domain: string;
  name: string | null;
  description: string | null;
  category: string | null;
  voucher_url: string | null;
  voucher_url_verified: boolean | null;
};

export type PublishCheck = { label: string; ok: boolean };

const PUBLISHABLE_STATUSES: readonly ShopStatus[] = ["confirmed", "ai_confirmed"];

// The conditions a shop must meet before a human may publish it. Shown as a
// checklist in the UI and enforced again in the Server Action.
// `categoryKeys` are the active categories (the categories table).
export function publishChecks(shop: PublishCheckInput, categoryKeys: readonly string[]): PublishCheck[] {
  const name = shop.name?.trim() ?? "";
  return [
    {
      label: "Статус „Потвърден“ или „Потвърден от AI“",
      ok: PUBLISHABLE_STATUSES.includes(shop.status as ShopStatus),
    },
    {
      label: "Има URL на ваучерите и е потвърден",
      ok: Boolean(shop.voucher_url) && shop.voucher_url_verified === true,
    },
    { label: "Има категория от списъка", ok: Boolean(shop.category) && categoryKeys.includes(shop.category ?? "") },
    {
      label: "Име, въведено от човек (не домейнът)",
      ok: name !== "" && name.toLowerCase() !== shop.domain.toLowerCase(),
    },
    { label: "Има описание", ok: Boolean(shop.description?.trim()) },
  ];
}

export function canPublish(shop: PublishCheckInput, categoryKeys: readonly string[]) {
  return publishChecks(shop, categoryKeys).every((check) => check.ok);
}
