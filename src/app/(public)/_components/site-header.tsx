import Link from "next/link";

import { Confetti, LogoMark, Wordmark } from "./logo";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" aria-hidden className={className}>
      <circle cx="11" cy="11" r="7" className="stroke-brand-ink" />
      <path d="M16.5 16.5L21 21" className="stroke-brand-ink" />
    </svg>
  );
}

// One header for both breakpoints (Main and Desktop artboards). Below md the
// search field collapses to an icon; categories are reached from the browse
// page's chip row and /kategorii.
export function SiteHeader() {
  return (
    <header className="relative bg-brand-ground md:border-b-2 md:border-brand-ink">
      <Confetti className="pointer-events-none absolute right-1.5 top-1 h-[58px] w-[130px] md:hidden" />

      <div className="relative mx-auto flex items-center justify-between gap-8 px-4 pb-0.5 pt-3 md:h-[76px] md:justify-start md:px-10 md:py-0">
        <Link href="/" className="flex shrink-0 items-center gap-2 md:gap-2.5" aria-label="vaucherche — начало">
          <LogoMark className="size-[30px] md:size-9" />
          <Wordmark className="text-lg md:text-[21px]" />
        </Link>

        <form
          action="/tarsene"
          method="get"
          role="search"
          className="hidden max-w-[560px] flex-1 md:block"
        >
          <label className="flex h-[46px] items-center gap-2.5 rounded-[23px] border-2 border-brand-ink bg-brand-card px-4">
            <SearchIcon className="size-[18px] shrink-0" />
            <span className="sr-only">Търси магазин или категория</span>
            <input
              name="q"
              type="search"
              placeholder="Търси магазин или категория…"
              className="w-full bg-transparent font-ui text-sm text-brand-ink placeholder:text-brand-quiet focus:outline-none"
            />
          </label>
        </form>

        <nav aria-label="Основна навигация" className="hidden items-center gap-[22px] md:ml-auto md:flex">
          <Link href="/kategorii" className="font-ui text-sm font-bold text-brand-ink hover:underline">
            Категории
          </Link>
        </nav>

        <Link
          href="/tarsene"
          aria-label="Търсене"
          className="-mr-2.5 flex size-11 items-center justify-center md:hidden"
        >
          <SearchIcon className="size-[21px]" />
        </Link>
      </div>
    </header>
  );
}
