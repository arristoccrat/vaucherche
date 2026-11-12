import localFont from "next/font/local";

// Public-site faces, self-hosted from src/lib/fonts (see its README): the
// build fetches nothing, and each file carries Latin and Cyrillic, so
// Bulgarian text never falls back to a system font. Only the display face is
// preloaded.
const display = localFont({
  src: "./fonts/Unbounded-wght600-800.woff2",
  weight: "600 800",
  variable: "--font-display",
  display: "swap",
});
const ui = localFont({
  src: "./fonts/Manrope-wght400-800.woff2",
  weight: "400 800",
  variable: "--font-ui",
  display: "swap",
  preload: false,
});
const num = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-num",
  display: "swap",
  preload: false,
  // Keep layout steady while the face loads.
  adjustFontFallback: "Arial",
});

export const publicFontVariables = `${display.variable} ${ui.variable} ${num.variable}`;
