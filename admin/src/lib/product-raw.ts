import type { Tables } from "@/lib/database.types";

// The heavy per-product capture, fetched on demand for the raw-data drawer and
// never part of the list query (raw_text alone runs to ~20k characters).
export const PRODUCT_RAW_COLUMNS =
  "id, url, title, description, breadcrumb, meta, links, raw_text, fetched_at, found_at" as const;

export type ProductRaw = Pick<
  Tables<"voucher_products">,
  | "id"
  | "url"
  | "title"
  | "description"
  | "breadcrumb"
  | "meta"
  | "links"
  | "raw_text"
  | "fetched_at"
  | "found_at"
>;
