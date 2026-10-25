import { describe, expect, it } from "vitest";

import { matchingCategories, normalizeQuery, searchFilter, searchPatterns, transliterate } from "./search-query";

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
  it("matches words in order across every column, in both scripts", () => {
    expect(searchPatterns("Гранд хотел")).toEqual(["*гранд*хотел*", "*grand*hotel*"]);
    expect(searchPatterns("spa")).toEqual(["*spa*"]);
    expect(searchFilter("spa")).toBe(
      "name.ilike.*spa*,domain.ilike.*spa*,subcategory.ilike.*spa*,description.ilike.*spa*"
    );
  });
});

describe("matchingCategories", () => {
  it("matches the Bulgarian label or the Latin path", () => {
    expect(matchingCategories("спа")).toContain("spa-wellness");
    expect(matchingCategories("knigi")).toContain("books-music");
    expect(matchingCategories("")).toEqual([]);
  });
});
