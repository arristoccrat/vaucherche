import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "@/lib/categories";

import { categoryInputSchema, nextPreviousPaths, suggestPath } from "./category-input";

const valid = { label: "Фотография", path: "fotografiya", bg: "#1a4fd6", icon: "Camera" };

describe("category input", () => {
  it("accepts a readable colour and picks the text colour", () => {
    const parsed = categoryInputSchema.parse(valid);
    expect(parsed).toMatchObject({ bg: "#1A4FD6", on: "white", path: "fotografiya" });
    expect(categoryInputSchema.parse({ ...valid, bg: "#FBB03B" }).on).toBe("ink");
  });

  it("refuses a colour neither ink nor white text can read on", () => {
    const result = categoryInputSchema.safeParse({ ...valid, bg: "#808080" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/не се чете/);
  });

  it("refuses Cyrillic paths, empty names and unknown icons", () => {
    expect(categoryInputSchema.safeParse({ ...valid, path: "фото" }).success).toBe(false);
    expect(categoryInputSchema.safeParse({ ...valid, label: "  " }).success).toBe(false);
    expect(categoryInputSchema.safeParse({ ...valid, icon: "Rocket" }).success).toBe(false);
  });

  it("accepts every built-in category as it is", () => {
    for (const c of DEFAULT_CATEGORIES) {
      expect(categoryInputSchema.parse({ label: c.label, path: c.path, bg: c.bg, icon: c.icon }).on).toBe(c.on);
    }
  });
});

describe("paths", () => {
  it("suggests a Latin path from a Bulgarian name", () => {
    expect(suggestPath("Цветя и подаръци")).toBe("tsvetya-i-podaratsi");
    expect(suggestPath("  Спорт & Хоби! ")).toBe("sport-hobi");
  });

  it("keeps old paths for redirects and drops one that is reused", () => {
    expect(nextPreviousPaths([], "knigi", "knigi-i-muzika")).toEqual(["knigi"]);
    expect(nextPreviousPaths(["knigi"], "knigi-i-muzika", "knigi")).toEqual(["knigi-i-muzika"]);
    expect(nextPreviousPaths(["a"], "b", "b")).toEqual(["a"]);
  });
});
