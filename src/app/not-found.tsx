import Link from "next/link";

import { SiteFooter } from "@/app/(public)/_components/site-footer";
import { SiteHeader } from "@/app/(public)/_components/site-header";
import { publicFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

// Any URL no route matches. Rendered outside the (public) layout, so it
// brings the public header, footer and fonts itself.
export default function NotFound() {
  return (
    <div className={cn(publicFontVariables, "flex min-h-screen flex-col bg-brand-ground font-ui text-brand-body antialiased")}>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="font-num text-sm font-semibold text-brand-quiet">404</p>
          <h1 className="mt-2 font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">Няма такава страница</h1>
          <p className="mt-2 text-[15px]">Адресът е грешен или страницата е преместена.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-amber px-5 font-ui text-sm font-extrabold text-brand-ink"
            >
              Всички ваучери
            </Link>
            <Link
              href="/kategorii"
              className="inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-card px-5 font-ui text-sm font-extrabold text-brand-ink"
            >
              Категории
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
