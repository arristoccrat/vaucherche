import { describe, expect, it } from "vitest";

import { BRAND } from "@/lib/brand";
import { DEFAULT_CATEGORIES, onColorHex, tintHex } from "@/lib/categories";
import { contrastRatio } from "@/lib/contrast";

const AA = 4.5;

// The 18 seed categories (sql/007). Categories added later in the admin are
// checked when saved (src/lib/category-input.ts).
describe("seed category colours", () => {
  it("has 18 categories with unique keys, colours and paths", () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(18);
    expect(new Set(DEFAULT_CATEGORIES.map((c) => c.key)).size).toBe(18);
    expect(new Set(DEFAULT_CATEGORIES.map((c) => c.bg)).size).toBe(18);
    expect(new Set(DEFAULT_CATEGORIES.map((c) => c.path)).size).toBe(18);
    for (const c of DEFAULT_CATEGORIES) {
      expect(c.path).toMatch(/^[a-z0-9-]+$/); // never Cyrillic in URLs
    }
  });

  it.each(DEFAULT_CATEGORIES.map((c) => [c.key, c] as const))("%s text clears 4.5:1 on its band", (_key, c) => {
    expect(contrastRatio(c.bg, onColorHex(c.on))).toBeGreaterThanOrEqual(AA);
  });
});

describe("brand text tokens", () => {
  const surfaces = { ground: BRAND.ground, card: BRAND.card };
  const texts = { ink: BRAND.ink, body: BRAND.body, quiet: BRAND.quiet, "mint-deep": BRAND["mint-deep"] };

  for (const [textName, text] of Object.entries(texts)) {
    for (const [surfaceName, surface] of Object.entries(surfaces)) {
      it(`${textName} on ${surfaceName} clears 4.5:1`, () => {
        expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it("ink on amber and on mint clears 4.5:1", () => {
    expect(contrastRatio(BRAND.ink, BRAND.amber)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(BRAND.ink, BRAND.mint)).toBeGreaterThanOrEqual(AA);
  });
});

describe("tintHex", () => {
  it("mixes a colour with white", () => {
    expect(tintHex("#000000", 0.2)).toBe("#CCCCCC");
    expect(tintHex("#C2185B", 0)).toBe("#FFFFFF");
    expect(tintHex("#C2185B", 1)).toBe("#C2185B");
  });

  it("falls back to white for anything that is not a 6-digit hex", () => {
    expect(tintHex("red")).toBe("#FFFFFF");
  });
});

describe("city labels", () => {
  it("reads a local shop's scope", async () => {
    const { localLabel, inCity } = await import("@/lib/cities");
    expect(localLabel(true, "plovdiv")).toBe("Само в Пловдив");
    expect(localLabel(true, "vratsa")).toBe("Само във Враца");
    expect(localLabel(true, "varna")).toBe("Само във Варна");
    expect(localLabel(true, null)).toBe("Само на място");
    expect(localLabel(false, "sofia")).toBeNull();
    expect(inCity("София")).toBe("в София");
  });
});

describe("local detail", () => {
  it("reads on the spot or delivery, defaulting to on the spot", async () => {
    const { localDetail } = await import("@/lib/cities");
    expect(localDetail("delivery")).toBe("доставка само в града");
    expect(localDetail("on_site")).toBe("ползва се на място в обекта");
    expect(localDetail(null)).toBe("ползва се на място в обекта");
  });
});
