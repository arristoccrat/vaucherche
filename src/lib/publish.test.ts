import { describe, expect, it } from "vitest";

import { canPublish, publishChecks } from "./publish";

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
});
