import { BRAND } from "@/lib/brand";
import { tintHex } from "@/lib/categories";

import { BrandMark, OG_CONTENT_TYPE, OG_SIZE, ogImage } from "./_lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "vaucherche — подаръчни ваучери за всеки повод";

// The site's own share image (home page and any page without its own). No
// data, so it is drawn once at build time.
export default async function Image() {
  return ogImage({
    title: "Подаръчни ваучери за всеки повод",
    subtitle: "Суми, срок и как се получават — на едно място",
    wash: tintHex(BRAND.amber, 0.35),
    mark: <BrandMark />,
  });
}
