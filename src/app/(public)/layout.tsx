import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

import { publicFontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

// Canonical and Open Graph URLs resolve against the production domain.
// Every page title ends in "| vaucherche"; the home page uses the default.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Подаръчни ваучери за всеки повод | vaucherche",
    template: "%s | vaucherche",
  },
  description:
    "Подаръчни ваучери и карти за подарък за всеки повод: спа, преживявания, ресторанти, красота и още. Суми в евро, срок на валидност и как се получават.",
  openGraph: { siteName: "vaucherche", locale: "bg_BG", type: "website" },
  // Large share previews on X too; the image is each page's opengraph-image.
  twitter: { card: "summary_large_image" },
};

// Before launch the middleware sends visitors to /coming-soon instead, so
// this layout only renders for previewers (and everyone after launch).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        publicFontVariables,
        "flex min-h-screen flex-col bg-brand-ground font-ui text-brand-body antialiased"
      )}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Vercel Web Analytics: cookieless page views, public site only. */}
      <Analytics />
    </div>
  );
}
