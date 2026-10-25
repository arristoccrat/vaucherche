"use client";

import Link from "next/link";

// A public page failed to load (usually the database). Header and footer
// stay; the visitor can retry or go home.
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">Нещо се обърка</h1>
      <p className="mt-2 text-[15px] text-brand-body">Не успяхме да заредим страницата. Опитай отново след малко.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-amber px-5 font-ui text-sm font-extrabold text-brand-ink"
        >
          Опитай пак
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-card px-5 font-ui text-sm font-extrabold text-brand-ink"
        >
          Начало
        </Link>
      </div>
    </div>
  );
}
