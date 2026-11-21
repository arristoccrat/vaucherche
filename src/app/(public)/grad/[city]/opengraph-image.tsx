import { BRAND } from "@/lib/brand";
import { findCity, inCity } from "@/lib/cities";
import { tintHex } from "@/lib/categories";

import { shopCountLabel } from "../../_lib/browse-params";
import { getVisibleCities } from "../../_lib/categories";
import { OG_CONTENT_TYPE, OG_SIZE, PinMark, ogImage } from "../../_lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Подаръчни ваучери по град във vaucherche";

// The share image of a city page.
export default async function Image({ params }: { params: { city: string } }) {
  const cities = await getVisibleCities();
  const visible = cities.find((c) => c.key === params.city);
  const city = visible && findCity(visible.key);
  return ogImage({
    title: city ? `Ваучери ${inCity(city.label)}` : "Подаръчни ваучери",
    subtitle: "Подаръчни ваучери за места в града",
    chips: visible ? [shopCountLabel(visible.count)] : [],
    wash: tintHex(BRAND.mint),
    mark: <PinMark color={BRAND.ink} />,
  });
}
