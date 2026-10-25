// Public-site palette, derived from the vaucherche logo (mint, amber, cream).
// The only place these hex values live: Tailwind reads them from here
// (`bg-brand-ground`, `text-brand-ink`, …) and the contrast test checks them.
export const BRAND = {
  ground: "#FAF2EA", // page background, the logo's cream
  card: "#FFFFFF", // card and panel fill
  ink: "#10302A", // borders, headings, body emphasis
  body: "#4A5A54", // body text
  // Spec value #6E7D77 is 3.90:1 on ground; darkened just enough to reach 4.5:1.
  quiet: "#65726D", // meta text, placeholders
  mint: "#6FC4A2", // large brand fills only, ink text on it, never white
  "mint-deep": "#0F7A5C", // small brand elements: pills, icons, links
  amber: "#FBB03B", // selected state and the primary CTA only, ink text on it
  hair: "#E4D9CA", // dividers
  dashed: "#CFC3B4", // dashed borders on "more" chips
  // The logo's own colours (from the master PNG), used only by the logo.
  "logo-mint": "#7BC4A4",
  "logo-cream": "#FFF8F0",
  "logo-amber": "#FFB84D",
} as const;

export type BrandToken = keyof typeof BRAND;
