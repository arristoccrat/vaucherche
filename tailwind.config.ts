import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

import { BRAND } from "./src/lib/brand";

const config: Config = {
  // The public site follows the OS dark setting; the admin (inside
  // .admin-root) is always light, so its dark: variants never fire.
  darkMode: [
    "variant",
    "@media (prefers-color-scheme: dark) { &:not(.admin-root *) }",
  ],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        // Public site (fonts loaded in src/app/(public)/layout.tsx)
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
        num: ["var(--font-num)", "ui-monospace", "monospace"],
      },
      colors: {
        // Public site palette: bg-brand-ground, text-brand-ink, border-brand-ink, …
        brand: BRAND,
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
};
export default config;
