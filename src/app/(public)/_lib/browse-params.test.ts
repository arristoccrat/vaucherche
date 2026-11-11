import { describe, expect, it } from "vitest";

import { deliveryKeys } from "@/lib/offer-fields";

import { deliveryFilter, parseBrowseFilters } from "./browse-params";

describe("delivery filter", () => {
  it("is empty when nothing is chosen", () => {
    expect(deliveryFilter([])).toBeNull();
  });

  it("matches the stored key and the crawler's words, without words that need quoting", () => {
    expect(deliveryFilter(["in_store"])).toBe("delivery_methods.ov.{in_store,in-store,instore,store,pickup,shop,магазин}");
  });

  it("lets a digital voucher match on is_digital too", () => {
    const filter = deliveryFilter(["digital", "delivery"]);
    expect(filter).toMatch(/^delivery_methods\.ov\.\{digital,email,.*,delivery,courier,.*\},is_digital\.eq\.true$/);
  });

  it("reads the old ?dostavka=physical as delivery and drops unknown values", () => {
    expect(parseBrowseFilters({ dostavka: "physical,digital,boat" }).dostavka).toEqual(["delivery", "digital"]);
  });

  it("reads crawler words in the admin the same way", () => {
    expect(deliveryKeys(["Email", "куриер", "in_store", "fax"])).toEqual(["digital", "delivery", "in_store"]);
  });
});
