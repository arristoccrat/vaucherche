import { IBM_Plex_Mono, Manrope, Unbounded } from "next/font/google";

import { isSiteLaunched } from "@/lib/site";
import { cn } from "@/lib/utils";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

// All three with the Cyrillic subset: without it Bulgarian text silently
// falls back to a system font. Only the display face is preloaded.
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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Before launch, production shows only the coming soon page, without chrome.
  if (!isSiteLaunched()) return children;

  return (
    <div
      className={cn(
        display.variable,
        ui.variable,
        num.variable,
        "flex min-h-screen flex-col bg-brand-ground font-ui text-brand-body antialiased"
      )}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
