import { publicFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

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
    </div>
  );
}
