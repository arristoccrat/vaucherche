import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "@/lib/categories";

import { canPublish as canPublishWith, publishChecks as checksWith } from "./publish";

const keys = DEFAULT_CATEGORIES.map((c) => c.key);
const canPublish = (shop: Parameters<typeof canPublishWith>[0]) => canPublishWith(shop, keys);
const publishChecks = (shop: Parameters<typeof checksWith>[0]) => checksWith(shop, keys);

const ready = {
  status: "confirmed",
  domain: "spa.bg",
  name: "Спа Център",
  description: "Ваучери за масаж.",
  category: "spa-wellness",
  voucher_url: "https://spa.bg/vouchers",
  voucher_url_verified: true,
};

describe("publish gate", () => {
  it("passes a shop with every field in place", () => {
    expect(canPublish(ready)).toBe(true);
  });

  it("refuses a category outside the 18 site categories", () => {
    expect(canPublish({ ...ready, category: "spa" })).toBe(false);
    expect(canPublish({ ...ready, category: null })).toBe(false);
    const check = publishChecks({ ...ready, category: "spa" }).find((c) => c.label.startsWith("Има категория"));
    expect(check?.ok).toBe(false);
  });

  it("refuses a category that was archived (no longer in the active list)", () => {
    expect(canPublishWith(ready, keys.filter((k) => k !== "spa-wellness"))).toBe(false);
  });
});
