import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { onColorHex } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";

import { browsePath, shopCountLabel } from "../_lib/browse-params";
import { getVisibleCategories } from "../_lib/categories";

// Rendered per request (the Supabase fetch itself is cached for an hour), so
// the build never needs database credentials.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Всички категории подаръчни ваучери | vaucherche",
  description: "Подаръчни ваучери по повод: спа, преживявания, храна, красота, книги, детски, мода и още — от български онлайн магазини.",
  alternates: { canonical: "/kategorii" },
};

// "За какъв повод?" — every category with published shops as a tile, in the
// admin's order.
export default async function CategoriesPage() {
  const { visible, counts } = await getVisibleCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Всички ваучери" className="-ml-2 flex size-11 items-center justify-center text-brand-ink">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-brand-ink lg:text-[30px]">
          За какъв повод?
        </h1>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:mt-6 lg:grid-cols-4 lg:gap-4">
        {visible.map((category) => {
          const Icon = categoryIcon(category.icon);
          return (
            <li key={category.key}>
              <Link
                href={browsePath(category)}
                className="flex min-h-[104px] flex-col rounded-[18px] border-2 border-brand-ink p-4 transition-transform hover:-translate-y-0.5 lg:min-h-[132px]"
                style={{ backgroundColor: category.bg, color: onColorHex(category.on) }}
              >
                <Icon className="size-5" aria-hidden />
                <span className="mt-auto pt-5 font-ui text-[15px] font-extrabold leading-tight lg:text-[17px]">{category.label}</span>
                <span className="mt-0.5 font-num text-[11.5px] font-semibold">{shopCountLabel(counts[category.key] ?? 0)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
