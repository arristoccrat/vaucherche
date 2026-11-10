import { describe, expect, it } from "vitest";

import { outboundHref, outboundUrl } from "./outbound";

describe("outbound", () => {
  it("sends visitors to the verified voucher page", () => {
    expect(outboundUrl({ voucherUrl: "https://shop.bg/vouchers", firstProductUrl: "https://shop.bg/v25" })).toBe(
      "https://shop.bg/vouchers"
    );
  });

  it("falls back to the first product page, then nowhere", () => {
    expect(outboundUrl({ voucherUrl: null, firstProductUrl: "https://shop.bg/v25" })).toBe("https://shop.bg/v25");
    expect(outboundUrl({ voucherUrl: null, firstProductUrl: null })).toBeNull();
  });

  it("builds the link", () => {
    expect(outboundHref("grand-hotel")).toBe("/out/grand-hotel");
  });
});
