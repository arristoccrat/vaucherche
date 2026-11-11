import { BRAND } from "@/lib/brand";
import { contrastRatio } from "@/lib/contrast";

// Gift categories. The live list is the `categories` table (sql/007), edited
// in /admin/categories; this file holds the shape, the helpers and the
// original 18 (the seed, and the fallback while the table does not exist).
//
// `key` is stored in shops.category and never changes. `label` is the
// Bulgarian name, `path` the Latin URL segment (/kategoriya/<path>); a
// changed path keeps the old one in `previousPaths`, which redirects. `bg`
// is the band colour, `on` the text colour on it (always ≥4.5:1, checked
// when a category is saved), `icon` a name from src/lib/category-icons.tsx.

export type OnColor = "ink" | "white";

export type Category = {
  key: string;
  label: string;
  path: string;
  bg: string;
  on: OnColor;
  icon: string;
  sortOrder: number;
  previousPaths: string[];
};

export const MIN_CONTRAST = 4.5;
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const seed = (
  key: string,
  label: string,
  path: string,
  bg: string,
  on: OnColor,
  icon: string,
  sortOrder: number
): Category => ({ key, label, path, bg, on, icon, sortOrder, previousPaths: [] });

export const DEFAULT_CATEGORIES: readonly Category[] = [
  seed("spa-wellness", "Спа и уелнес", "spa-i-uelnes", "#6FC4A2", "ink", "Flower2", 10),
  // Spec value #D7441A is 4.44:1 with white; this is the nearest passing shade.
  seed("experience", "Преживявания", "prezhivyavaniya", "#D5431A", "white", "Mountain", 20),
  seed("food-drink", "Храна и напитки", "hrana-i-napitki", "#A85D00", "white", "Utensils", 30),
  seed("beauty", "Красота", "krasota", "#C2185B", "white", "Sparkles", 40),
  seed("books-music", "Книги", "knigi", "#1A4FD6", "white", "BookOpen", 50),
  seed("toys-kids", "Детски", "detski", "#7A1FD4", "white", "ToyBrick", 60),
  seed("fashion", "Мода", "moda", "#10302A", "white", "Shirt", 70),
  seed("home", "За дома", "za-doma", "#1B6B8C", "white", "House", 80),
  seed("sport-outdoor", "Спорт", "sport", "#0F7A5C", "white", "Dumbbell", 90),
  seed("flowers-gifts", "Цветя и подаръци", "tsvetya-i-podaratsi", "#FBB03B", "ink", "Heart", 100),
  seed("restaurant", "Ресторанти", "restoranti", "#9C2A2A", "white", "UtensilsCrossed", 110),
  seed("jewellery", "Бижута", "bizhuta", "#8A6A00", "white", "Gem", 120),
  seed("electronics", "Електроника", "elektronika", "#2F3E57", "white", "Smartphone", 130),
  seed("travel-hotel", "Пътувания и хотели", "patuvaniya-i-hoteli", "#6A4C93", "white", "Plane", 140),
  seed("pets", "Домашни любимци", "domashni-lyubimtsi", "#7A4E2D", "white", "PawPrint", 150),
  seed("health-pharmacy", "Здраве и аптеки", "zdrave-i-apteki", "#2E6B30", "white", "HeartPulse", 160),
  seed("auto", "Авто", "avto", "#4A4F57", "white", "Car", 170),
  seed("other", "Други", "drugi", "#5C6B66", "white", "Gift", 180),
];

// What a shop shows when its category is missing, archived or unknown: a
// neutral band with no category page behind it.
export const FALLBACK_CATEGORY: Category = {
  key: "",
  label: "Други",
  path: "",
  bg: "#5C6B66",
  on: "white",
  icon: "Gift",
  sortOrder: 0,
  previousPaths: [],
};

// A pale wash of a category colour (mixed with white), for card backgrounds
// that carry no text of their own. `weight` is the share of the colour.
export function tintHex(hex: string, weight = 0.18) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#FFFFFF";
  const mix = (i: number) => {
    const channel = parseInt(value.slice(i, i + 2), 16);
    return Math.round(255 - (255 - channel) * weight)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`.toUpperCase();
}

export function onColorHex(on: OnColor) {
  return on === "ink" ? BRAND.ink : "#FFFFFF";
}

// The text colour that reads best on a band colour, and whether it is enough.
export function textColorFor(bg: string) {
  const ink = contrastRatio(bg, onColorHex("ink"));
  const white = contrastRatio(bg, onColorHex("white"));
  const on: OnColor = ink >= white ? "ink" : "white";
  const ratio = Math.max(ink, white);
  return { on, ratio, ok: ratio >= MIN_CONTRAST };
}

export function findCategory(categories: readonly Category[], key: string | null | undefined) {
  return key ? categories.find((c) => c.key === key) : undefined;
}

// For display: the shop's category, or the neutral fallback.
export function categoryOrFallback(categories: readonly Category[], key: string | null | undefined) {
  return findCategory(categories, key) ?? FALLBACK_CATEGORY;
}

export function findCategoryByPath(categories: readonly Category[], path: string) {
  return categories.find((c) => c.path === path);
}

// A category that used to live at this path (renamed URL), for a redirect.
export function findCategoryByPreviousPath(categories: readonly Category[], path: string) {
  return categories.find((c) => c.previousPaths.includes(path));
}

export function bySortOrder(a: Category, b: Category) {
  return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "bg");
}

export const CATEGORY_COLUMNS = "key, label, path, previous_paths, bg, on_color, icon, sort_order, archived_at";

export type CategoryRow = {
  key: string;
  label: string;
  path: string;
  previous_paths: string[] | null;
  bg: string;
  on_color: string;
  icon: string;
  sort_order: number;
  archived_at?: string | null;
};

export function categoryFromRow(row: CategoryRow): Category {
  return {
    key: row.key,
    label: row.label,
    path: row.path,
    bg: row.bg,
    on: row.on_color === "ink" ? "ink" : "white",
    icon: row.icon,
    sortOrder: row.sort_order,
    previousPaths: row.previous_paths ?? [],
  };
}

// The table does not exist yet (sql/007 not run): callers fall back to
// DEFAULT_CATEGORIES so the site keeps working.
export function isMissingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

// What admin client components need: names for keys, and which are active.
export type CategoryOption = { key: string; label: string; archived: boolean };

export function categoryOptions(active: readonly Category[], archived: readonly Category[] = []): CategoryOption[] {
  return [
    ...active.map((c) => ({ key: c.key, label: c.label, archived: false })),
    ...archived.map((c) => ({ key: c.key, label: c.label, archived: true })),
  ];
}

export function activeKeys(options: readonly CategoryOption[]) {
  return options.filter((o) => !o.archived).map((o) => o.key);
}

// "Спа и уелнес", "Книги (архивирана)" or "books (невалидна)".
export function describeCategory(options: readonly CategoryOption[], key: string) {
  const option = options.find((o) => o.key === key);
  if (!option) return { text: `${key} (невалидна)`, ok: false };
  return option.archived ? { text: `${option.label} (архивирана)`, ok: false } : { text: option.label, ok: true };
}
