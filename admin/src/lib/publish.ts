import type { ShopStatus } from "@/lib/domain";

export type PublishCheckInput = {
  status: string;
  domain: string;
  name: string | null;
  category: string | null;
  voucher_url: string | null;
  voucher_url_verified: boolean | null;
};

export type PublishCheck = { label: string; ok: boolean };

const PUBLISHABLE_STATUSES: readonly ShopStatus[] = ["confirmed", "ai_confirmed"];

// The conditions a shop must meet before a human may publish it. Shown as a
// checklist in the UI and enforced again in the Server Action.
// TODO(Phase 5): add "description is filled in" once the column exists.
export function publishChecks(shop: PublishCheckInput): PublishCheck[] {
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
    { label: "Има категория", ok: Boolean(shop.category) },
    {
      label: "Име, въведено от човек (не домейнът)",
      ok: name !== "" && name.toLowerCase() !== shop.domain.toLowerCase(),
    },
  ];
}

export function canPublish(shop: PublishCheckInput) {
  return publishChecks(shop).every((check) => check.ok);
}
