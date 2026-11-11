import { describe, expect, it } from "vitest";

import { deliveryKeys } from "@/lib/offer-fields";

import type { Category } from "@/lib/categories";

import {
  DEFAULT_FILTERS,
  allOf,
  amountFilter,
  browseHref,
  canonicalBrowseUrl,
  categoriesLabel,
  deliveryFilter,
  parseBrowseFilters,
} from "./browse-params";

const cat = (key: string, path: string, label: string) => ({ key, path, label }) as Category;
const sport = cat("sport-outdoor", "sport", "Спорт");
const beauty = cat("beauty", "krasota", "Красота");
const books = cat("books-music", "knigi", "Книги");

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
    expect(parseBrowseFilters({ dostavka: "physical,digital,boat" }).dostavka).toEqual(["digital", "delivery"]);
  });

  it("reads crawler words in the admin the same way", () => {
    expect(deliveryKeys(["Email", "куриер", "in_store", "fax"])).toEqual(["digital", "delivery", "in_store"]);
  });
});

describe("several choices per filter", () => {
  it("reads lists of categories and amounts, in a fixed order, dropping unknown ones", () => {
    const f = parseBrowseFilters({ kategoriya: "beauty,nope,sport-outdoor,beauty", suma: "po-izbor,100 ,0-25,xx" }, [sport, beauty]);
    expect(f.kategorii.map((c) => c.key)).toEqual(["beauty", "sport-outdoor"]);
    expect(f.suma).toEqual(["0-25", "100+", "po-izbor"]);
  });

  it("puts one category in the path and several in the home page's query", () => {
    expect(browseHref(DEFAULT_FILTERS, { kategorii: [sport] })).toBe("/kategoriya/sport");
    expect(browseHref(DEFAULT_FILTERS, { kategorii: [sport, beauty], suma: ["0-25", "po-izbor"] })).toBe(
      "/?kategoriya=sport-outdoor,beauty&suma=0-25,po-izbor"
    );
    expect(canonicalBrowseUrl({ ...DEFAULT_FILTERS, kategorii: [sport, beauty] })).toMatch(/\/$/);
  });

  it("matches any chosen amount", () => {
    expect(amountFilter([])).toBeNull();
    expect(amountFilter(["0-25", "100+", "po-izbor"])).toBe(
      "and(max_eur.gte.0,min_eur.lte.25),max_eur.gte.100,custom_amount.eq.true"
    );
  });

  it("needs every filter group to hold", () => {
    expect(allOf([null, null])).toBeNull();
    expect(allOf(["a.eq.1", null])).toBe("a.eq.1");
    expect(allOf(["a.eq.1,b.eq.2", "c.eq.3"])).toBe("and(or(a.eq.1,b.eq.2),or(c.eq.3))");
  });

  it("names the chosen categories in the heading", () => {
    expect(categoriesLabel([sport])).toBe("Спорт");
    expect(categoriesLabel([sport, beauty, books])).toBe("Спорт, Красота и Книги");
  });
});
