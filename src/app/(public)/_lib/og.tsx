import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";
import { sniffImage } from "@/lib/images";

// Share images (Open Graph, 1200×630) for Facebook, Viber, Messenger and the
// like: a gift card on the category's colour, the name, what it is and the
// amounts. Drawn by next/og from our own fonts (static TTF instances in
// src/lib/fonts/og; it cannot read woff2) and brand tokens.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Read from the source tree; next.config.mjs (outputFileTracingIncludes)
// copies src/lib/fonts/og into every opengraph-image function.
const readFont = (name: string) => readFile(join(process.cwd(), "src/lib/fonts/og", name));

async function fonts() {
  const [display, ui, uiBold, num] = await Promise.all([
    readFont("Unbounded-ExtraBold.ttf"),
    readFont("Manrope-Medium.ttf"),
    readFont("Manrope-ExtraBold.ttf"),
    readFont("IBMPlexMono-SemiBold.ttf"),
  ]);
  return [
    { name: "Unbounded", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Manrope", data: ui, weight: 500 as const, style: "normal" as const },
    { name: "Manrope", data: uiBold, weight: 800 as const, style: "normal" as const },
    { name: "Plex", data: num, weight: 600 as const, style: "normal" as const },
  ];
}

// Our own storage copy of a logo as a data URI, when it is a format the
// renderer draws (PNG, JPEG, GIF); anything else falls back to the initial.
export async function logoDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = sniffImage(bytes);
    if (!type || !["image/png", "image/jpeg", "image/gif"].includes(type.mime)) return null;
    return `data:${type.mime};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

export type OgCard = {
  // The big line: the shop, category or city.
  title: string;
  // Under it, e.g. "Подаръчен ваучер".
  subtitle: string;
  // A small pill above the title (the category), in its colours.
  tag?: { label: string; bg: string; color: string };
  // Amount chips ("25 €", "50 €") or counts ("12 магазина").
  chips?: string[];
  // The panel behind the gift card, and what the card holds.
  wash: string;
  logo?: string | null;
  logoBg?: string | null;
  // Shown on the card when there is no logo: an initial or an icon.
  mark?: React.ReactNode;
};

export async function ogImage(card: OgCard) {
  const title = card.title.length > 48 ? `${card.title.slice(0, 46)}…` : card.title;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: BRAND.ground, fontFamily: "Manrope" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 470,
            height: "100%",
            background: card.wash,
            borderRight: `4px solid ${BRAND.ink}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 330,
              height: 206,
              borderRadius: 26,
              border: `4px solid ${BRAND.ink}`,
              background: card.logo && card.logoBg ? card.logoBg : BRAND.card,
              boxShadow: `12px 14px 0 0 ${BRAND.ink}`,
              transform: "rotate(-4deg)",
            }}
          >
            {card.logo ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- drawn into a PNG, not a page
              <img src={card.logo} style={{ width: 250, height: 140, objectFit: "contain" }} />
            ) : (
              card.mark
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 60px 48px 60px" }}>
          {card.tag ? (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: card.tag.bg,
                  color: card.tag.color,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {card.tag.label}
              </div>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: card.tag ? 26 : 0,
              fontFamily: "Unbounded",
              fontSize: title.length > 36 ? 46 : title.length > 26 ? 52 : 64,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: BRAND.ink,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: BRAND.body }}>{card.subtitle}</div>
          {card.chips?.length ? (
            <div style={{ display: "flex", gap: 14, marginTop: 34 }}>
              {card.chips.map((chip, i) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    padding: "10px 22px",
                    borderRadius: 999,
                    border: `3px solid ${BRAND.ink}`,
                    background: i === 0 ? BRAND.ink : BRAND.card,
                    color: i === 0 ? BRAND.card : BRAND.ink,
                    fontFamily: "Plex",
                    fontSize: 28,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: "flex", marginTop: "auto", justifyContent: "flex-end", fontFamily: "Unbounded", fontSize: 36, letterSpacing: -1 }}>
            <span style={{ color: BRAND.ink }}>vaucher</span>
            <span style={{ color: BRAND["mint-deep"], marginLeft: -9 }}>che</span>
            <span style={{ color: BRAND.quiet, fontFamily: "Manrope", fontWeight: 800, fontSize: 28, marginLeft: 4, alignSelf: "flex-end" }}>
              .bg
            </span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() }
  );
}

// The vaucherche mark (as in _components/logo.tsx), for the site's own image.
export function BrandMark() {
  return (
    <svg width={150} height={150} viewBox="0 0 112 112">
      <path
        d="M18 8H94a10 10 0 0 1 10 10V44a12 12 0 0 0 0 24V94a10 10 0 0 1-10 10H18a10 10 0 0 1-10-10V68a12 12 0 0 0 0-24V18a10 10 0 0 1 10-10z"
        fill={BRAND.mint}
        stroke={BRAND.ink}
        strokeWidth={5}
      />
      <path d="M34 41L56 77L78 41" fill="none" stroke={BRAND.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={89} cy={22} r={6.5} fill={BRAND.amber} stroke={BRAND.ink} strokeWidth={3.5} />
    </svg>
  );
}

// A map pin (the shape of lucide's MapPin), for city pages. The renderer
// draws plain SVG, not icon components.
export function PinMark({ color }: { color: string }) {
  return (
    <svg width={130} height={130} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

// A large initial in the category's colour, for shops without a logo.
export function Initial({ letter, color }: { letter: string; color: string }) {
  return <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: 120, color }}>{letter.toUpperCase()}</div>;
}
