import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";

// Search input handling, kept free of Supabase so it can be unit-tested.

export const MAX_QUERY_LENGTH = 60;

// Built with the constructor: the tsconfig target predates the /u flag.
const NOT_LETTER_OR_DIGIT = new RegExp("[^\\p{L}\\p{N}]+", "gu");

// Letters (any script), digits and single spaces only. Everything PostgREST
// or LIKE treats specially (, . ( ) " \ % _ *) is dropped, so a query can
// never change the filter it is put into.
export function normalizeQuery(raw: string | string[] | undefined) {
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  return value
    .normalize("NFC")
    .replace(NOT_LETTER_OR_DIGIT, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

// Streamlined System (the official Bulgarian transliteration), so "гранд"
// also finds grandhotelsofia.bg.
const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function transliterate(value: string) {
  return Array.from(value.toLowerCase(), (ch) => LATIN[ch] ?? ch).join("");
}

// ilike patterns for a normalized query: words in order, anything between.
export function searchPatterns(query: string) {
  const variants = new Set([query.toLowerCase(), transliterate(query)]);
  return Array.from(variants, (v) => `*${v.split(" ").join("*")}*`);
}

export const SEARCH_COLUMNS = ["name", "domain", "subcategory", "description"] as const;

// PostgREST or() filter over every column and pattern. Safe because
// normalizeQuery leaves nothing but letters, digits and spaces.
export function searchFilter(query: string) {
  return searchPatterns(query)
    .flatMap((pattern) => SEARCH_COLUMNS.map((column) => `${column}.ilike.${pattern}`))
    .join(",");
}

// Categories whose Bulgarian label or URL path contains the query.
export function matchingCategories(query: string): CategoryKey[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const latin = transliterate(query);
  return CATEGORY_KEYS.filter((key) => {
    const c = CATEGORIES[key];
    return c.label.toLowerCase().includes(lower) || c.path.includes(latin.replace(/ /g, "-"));
  });
}
