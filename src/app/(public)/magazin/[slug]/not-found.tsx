import Link from "next/link";

export default function ShopNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">Няма такъв магазин</h1>
      <p className="mt-2 text-[15px] text-brand-body">Магазинът не е в каталога или вече не е публикуван.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-full border-2 border-brand-ink bg-brand-amber px-5 font-ui text-sm font-extrabold text-brand-ink"
      >
        Всички ваучери
      </Link>
    </div>
  );
}
