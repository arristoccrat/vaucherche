import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">Няма такава категория</h1>
      <p className="mt-2 text-[15px] text-brand-body">Адресът е грешен или категорията е преименувана.</p>
      <Link
        href="/kategorii"
        className="mt-6 inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-amber px-5 font-ui text-sm font-extrabold text-brand-ink"
      >
        Всички категории
      </Link>
    </div>
  );
}
