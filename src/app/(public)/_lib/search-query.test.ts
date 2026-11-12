import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "@/lib/categories";

import { legacySearchFilter, matchingCategories, normalizeQuery, searchFilter, searchPatterns, transliterate } from "./search-query";

describe("normalizeQuery", () => {
  it("keeps letters, digits and single spaces", () => {
    expect(normalizeQuery("  Гранд   Хотел  ")).toBe("Гранд Хотел");
    expect(normalizeQuery(["spa 24", "x"])).toBe("spa 24");
    expect(normalizeQuery(undefined)).toBe("");
  });

  it("drops everything PostgREST or LIKE would interpret", () => {
    expect(normalizeQuery('a,b.c(d)"e\\f%g_h*i')).toBe("a b c d e f g h i");
    expect(normalizeQuery("name.eq.x),published.eq.false")).toBe("name eq x published eq false");
  });

  it("caps the length", () => {
    expect(normalizeQuery("я".repeat(200))).toHaveLength(60);
  });
});

describe("transliterate", () => {
  it("uses the Streamlined System", () => {
    expect(transliterate("Гранд Хотел")).toBe("grand hotel");
    expect(transliterate("Щастие ЮЖЕН")).toBe("shtastie yuzhen");
  });
});

describe("searchFilter", () => {
  it("looks for one word in search_text, as typed and transliterated", () => {
    expect(searchFilter("spa")).toBe("search_text.ilike.*spa*");
    expect(searchFilter("Книги")).toBe("search_text.ilike.*книги*,search_text.ilike.*knigi*");
  });

  it("needs every word, in any order", () => {
    expect(searchFilter("ваучер Ciela")).toBe(
      "and(or(search_text.ilike.*ваучер*,search_text.ilike.*vaucher*),or(search_text.ilike.*ciela*))"
    );
    expect(searchFilter("")).toBe("");
  });

  it("keeps the old column search for before sql/011", () => {
    expect(searchPatterns("Гранд хотел")).toEqual(["*гранд*хотел*", "*grand*hotel*"]);
    expect(legacySearchFilter("spa")).toBe(
      "name.ilike.*spa*,domain.ilike.*spa*,subcategory.ilike.*spa*,description.ilike.*spa*"
    );
  });
});

describe("matchingCategories", () => {
  it("matches the Bulgarian label or the Latin path", () => {
    const keys = (q: string) => matchingCategories(DEFAULT_CATEGORIES, q).map((c) => c.key);
    expect(keys("спа")).toContain("spa-wellness");
    expect(keys("knigi")).toContain("books-music");
    expect(keys("")).toEqual([]);
  });
});
