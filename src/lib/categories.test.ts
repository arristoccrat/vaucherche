import { describe, expect, it } from "vitest";

import { BRAND } from "@/lib/brand";
import { CATEGORIES, CATEGORY_KEYS, onColorHex } from "@/lib/categories";
import { contrastRatio } from "@/lib/contrast";

const AA = 4.5;

describe("category colours", () => {
  it("covers all 18 categories with unique colours and paths", () => {
    expect(CATEGORY_KEYS).toHaveLength(18);
    expect(new Set(CATEGORY_KEYS.map((k) => CATEGORIES[k].bg)).size).toBe(18);
    expect(new Set(CATEGORY_KEYS.map((k) => CATEGORIES[k].path)).size).toBe(18);
    for (const key of CATEGORY_KEYS) {
      expect(CATEGORIES[key].path).toMatch(/^[a-z0-9-]+$/); // never Cyrillic in URLs
    }
  });

  it.each(CATEGORY_KEYS)("%s text clears 4.5:1 on its band", (key) => {
    const { bg, on } = CATEGORIES[key];
    expect(contrastRatio(bg, onColorHex(on))).toBeGreaterThanOrEqual(AA);
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
