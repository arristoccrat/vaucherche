import Link from "next/link";

import { CATEGORIES, CATEGORY_KEYS, onColorHex } from "@/lib/categories";

export const revalidate = 3600;

// Phase 1 shell: the browse page replaces this in Phase 2. It exercises all
// three faces in Cyrillic and the category palette.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <p className="text-[13.5px] font-medium md:hidden">Подарък, който никога не е сгрешен</p>
      <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-ink md:text-[30px]">
        Подаръчни ваучери
      </h1>
      <p className="mt-1 font-num text-xs font-semibold text-brand-ink">
        {CATEGORY_KEYS.length} категории · проверени ръчно
      </p>

      <h2 className="mt-8 font-display text-[22px] font-bold tracking-[-0.01em] text-brand-ink">
        За какъв повод?
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORY_KEYS.map((key) => {
          const category = CATEGORIES[key];
          return (
            <li key={key}>
              <Link
                href={`/kategoriya/${category.path}`}
                className="flex h-[104px] flex-col justify-end rounded-[18px] border-2 border-brand-ink p-4"
                style={{ backgroundColor: category.bg, color: onColorHex(category.on) }}
              >
                <span className="font-ui text-[15px] font-extrabold leading-tight">{category.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
