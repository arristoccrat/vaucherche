import { describe, expect, it } from "vitest";

import { outboundHref, outboundUrl, parseAmount } from "./outbound";

const target = {
  amounts: [
    { eur: 25, url: "https://shop.bg/v25" },
    { eur: 50.5, url: "https://shop.bg/v50" },
  ],
  voucherUrl: "https://shop.bg/vouchers",
};

describe("outbound", () => {
  it("sends a known amount to its product page", () => {
    expect(outboundUrl(target, 50.5)).toBe("https://shop.bg/v50");
  });

  it("falls back to the verified voucher page, then the first product", () => {
    expect(outboundUrl(target, 999)).toBe("https://shop.bg/vouchers");
    expect(outboundUrl(target, null)).toBe("https://shop.bg/vouchers");
    expect(outboundUrl({ ...target, voucherUrl: null }, null)).toBe("https://shop.bg/v25");
    expect(outboundUrl({ amounts: [], voucherUrl: null }, 25)).toBeNull();
  });

  it("only ever reads an amount from the query", () => {
    expect(parseAmount("50,5")).toBe(50.5);
    expect(parseAmount("https://evil.example")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount(null)).toBeNull();
  });

  it("builds the link", () => {
    expect(outboundHref("grand-hotel", 50)).toBe("/out/grand-hotel?suma=50");
    expect(outboundHref("grand-hotel")).toBe("/out/grand-hotel");
  });
});
