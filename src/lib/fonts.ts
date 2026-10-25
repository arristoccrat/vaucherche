import { IBM_Plex_Mono, Manrope, Unbounded } from "next/font/google";

// Public-site faces, all with the Cyrillic subset: without it Bulgarian text
// silently falls back to a system font. Only the display face is preloaded.
const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const ui = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
  preload: false,
});
const num = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-num",
  display: "swap",
  preload: false,
});

export const publicFontVariables = `${display.variable} ${ui.variable} ${num.variable}`;
