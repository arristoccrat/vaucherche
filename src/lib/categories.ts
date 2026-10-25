import { BRAND } from "@/lib/brand";

// The 18 gift categories. Keys are the English slugs stored in
// shops.category; `label` is the Bulgarian display string (as on the design
// artboards) and `path` the
// transliterated URL segment (/kategoriya/<path>). One colour per category,
// used for the card band, the pill and the meta icon. Every bg/on pair must
// clear 4.5:1 — enforced by src/lib/categories.test.ts.

type OnColor = "ink" | "white";

export type Category = {
  bg: string;
  on: OnColor;
  label: string;
  path: string;
};

export const CATEGORIES = {
  "spa-wellness": { bg: "#6FC4A2", on: "ink", label: "Спа и уелнес", path: "spa-i-uelnes" },
  // Spec value #D7441A is 4.44:1 with white; this is the nearest passing shade.
  experience: { bg: "#D5431A", on: "white", label: "Преживявания", path: "prezhivyavaniya" },
  "food-drink": { bg: "#A85D00", on: "white", label: "Храна и напитки", path: "hrana-i-napitki" },
  beauty: { bg: "#C2185B", on: "white", label: "Красота", path: "krasota" },
  "books-music": { bg: "#1A4FD6", on: "white", label: "Книги", path: "knigi" },
  "toys-kids": { bg: "#7A1FD4", on: "white", label: "Детски", path: "detski" },
  fashion: { bg: "#10302A", on: "white", label: "Мода", path: "moda" },
  home: { bg: "#1B6B8C", on: "white", label: "За дома", path: "za-doma" },
  "sport-outdoor": { bg: "#0F7A5C", on: "white", label: "Спорт", path: "sport" },
  "flowers-gifts": { bg: "#FBB03B", on: "ink", label: "Цветя и подаръци", path: "tsvetya-i-podaratsi" },
  restaurant: { bg: "#9C2A2A", on: "white", label: "Ресторанти", path: "restoranti" },
  jewellery: { bg: "#8A6A00", on: "white", label: "Бижута", path: "bizhuta" },
  electronics: { bg: "#2F3E57", on: "white", label: "Електроника", path: "elektronika" },
  "travel-hotel": { bg: "#6A4C93", on: "white", label: "Пътувания и хотели", path: "patuvaniya-i-hoteli" },
  pets: { bg: "#7A4E2D", on: "white", label: "Домашни любимци", path: "domashni-lyubimtsi" },
  "health-pharmacy": { bg: "#2E6B30", on: "white", label: "Здраве и аптеки", path: "zdrave-i-apteki" },
  auto: { bg: "#4A4F57", on: "white", label: "Авто", path: "avto" },
  other: { bg: "#5C6B66", on: "white", label: "Други", path: "drugi" },
} as const satisfies Record<string, Category>;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === "string" && value in CATEGORIES;
}

// Unknown or missing categories render as "other" rather than breaking a card.
export function getCategory(key: string | null | undefined): Category & { key: CategoryKey } {
  const k: CategoryKey = isCategoryKey(key) ? key : "other";
  return { key: k, ...CATEGORIES[k] };
}

export function categoryByPath(path: string): (Category & { key: CategoryKey }) | null {
  const key = CATEGORY_KEYS.find((k) => CATEGORIES[k].path === path);
  return key ? { key, ...CATEGORIES[key] } : null;
}

export function onColorHex(on: OnColor) {
  return on === "ink" ? BRAND.ink : "#FFFFFF";
}
