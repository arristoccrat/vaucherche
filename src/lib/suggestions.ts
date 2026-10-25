import type { Json } from "@/lib/database.types";

// Suggestions for the editorial fields, read from what the crawler stored.
// Pure: no database access, so it is unit-tested and usable anywhere. The
// shapes of `meta`, `links` and `raw_extract` vary by merchant, so this walks
// them generically instead of assuming one layout.

export type Suggestion = { value: string; source: string; count: number };

export type CrawlSuggestions = {
  names: Suggestion[];
  logos: Suggestion[];
  covers: Suggestion[];
};

export type CrawledProduct = {
  url: string;
  title?: string | null;
  image_url?: string | null;
  meta?: Json | null;
  links?: Json | null;
};

const ORG_TYPES = new Set(["organization", "store", "onlinestore", "localbusiness", "brand", "corporation", "website"]);
const NAME_KEYS = /(^|[:._-])(site[_-]?name|application-name|apple-mobile-web-app-title)$/i;
const RAW_NAME_KEYS = /^(shop|store|merchant|brand|company)[_-]?name$/i;
const COVER_KEYS = /(^|[:._-])(og:image|image|twitter:image)(:url|:secure_url|:src)?$/i;
const LIMIT = 5;

type Bucket = Map<string, { source: string; count: number }>;

function add(bucket: Bucket, value: string | null | undefined, source: string) {
  const v = value?.trim();
  if (!v || v.length > 300) return;
  const entry = bucket.get(v);
  if (entry) entry.count += 1;
  else bucket.set(v, { source, count: 1 });
}

function absoluteUrl(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function typeOf(node: Record<string, Json | undefined>) {
  const t = node["@type"];
  const list = Array.isArray(t) ? t : [t];
  return list.filter((x): x is string => typeof x === "string").map((x) => x.toLowerCase());
}

function imageValue(value: Json | undefined): unknown {
  if (Array.isArray(value)) return imageValue(value[0]);
  if (value && typeof value === "object") return (value as Record<string, Json | undefined>).url;
  return value;
}

function shortPath(url: string) {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.hostname : u.pathname;
  } catch {
    return url;
  }
}

function walk(
  node: Json | undefined,
  key: string,
  visit: (key: string, value: Json, parent: Record<string, Json | undefined> | null) => void,
  parent: Record<string, Json | undefined> | null = null,
  depth = 0
) {
  if (node === undefined || node === null || depth > 8) return;
  visit(key, node, parent);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, key, visit, parent, depth + 1);
  } else if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(v, k, visit, node, depth + 1);
  }
}

export function suggestFromCrawl(
  domain: string,
  products: CrawledProduct[],
  rawExtracts: (Json | null)[] = []
): CrawlSuggestions {
  const names: Bucket = new Map();
  const logos: Bucket = new Map();
  const covers: Bucket = new Map();

  for (const product of products) {
    const where = shortPath(product.url);

    walk(product.meta ?? undefined, "", (key, value, parent) => {
      if (typeof value === "string") {
        // Flat tags, e.g. { "og:site_name": "…" } or { property, content } pairs.
        if (NAME_KEYS.test(key)) add(names, value, `${key} · ${where}`);
        if (COVER_KEYS.test(key) && !(parent && typeOf(parent).some((t) => ORG_TYPES.has(t)))) {
          add(covers, absoluteUrl(value, product.url), `${key} · ${where}`);
        }
        if (key === "content" && parent) {
          const prop = String(parent.property ?? parent.name ?? "");
          if (NAME_KEYS.test(prop)) add(names, value, `${prop} · ${where}`);
          if (COVER_KEYS.test(prop)) add(covers, absoluteUrl(value, product.url), `${prop} · ${where}`);
        }
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        // JSON-LD Organization / Store / Brand: name and logo.
        const obj = value as Record<string, Json | undefined>;
        const types = typeOf(obj);
        if (types.some((t) => ORG_TYPES.has(t))) {
          if (typeof obj.name === "string") add(names, obj.name, `JSON-LD ${types[0]} · ${where}`);
          add(logos, absoluteUrl(imageValue(obj.logo), product.url), `JSON-LD ${types[0]} · ${where}`);
        }
        if (types.includes("product")) {
          add(covers, absoluteUrl(imageValue(obj.image), product.url), `JSON-LD Product · ${where}`);
        }
      }
    });

    // <link rel="icon" / "apple-touch-icon"> captured as { rel, href }.
    walk(product.links ?? undefined, "", (_key, value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const obj = value as Record<string, Json | undefined>;
      const rel = String(obj.rel ?? "").toLowerCase();
      if (rel.includes("icon")) {
        add(logos, absoluteUrl(obj.href, product.url), `<link rel="${rel}"> · ${where}`);
      }
    });

    add(covers, absoluteUrl(product.image_url, product.url), `снимка на продукта · ${where}`);
  }

  for (const raw of rawExtracts) {
    walk(raw ?? undefined, "", (key, value) => {
      if (typeof value === "string" && RAW_NAME_KEYS.test(key)) add(names, value, `AI извличане (${key})`);
    });
  }

  const domainLower = domain.toLowerCase();
  const rank = (bucket: Bucket, skip?: (v: string) => boolean): Suggestion[] =>
    Array.from(bucket, ([value, { source, count }]) => ({ value, source, count }))
      .filter((s) => !skip?.(s.value))
      .sort((a, b) => b.count - a.count)
      .slice(0, LIMIT);

  return {
    // A name equal to the domain is no suggestion at all.
    names: rank(names, (v) => v.toLowerCase() === domainLower || v.toLowerCase() === `www.${domainLower}`),
    logos: rank(logos),
    covers: rank(covers),
  };
}
