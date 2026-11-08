import Link from "next/link";

import { formatCount } from "@/lib/format";
import { getAdminCategories } from "@/lib/queries/categories";
import { getCategoryCounts } from "@/lib/queries/shops";
import { DEFAULT_SHOP_FILTERS, shopsHref } from "@/lib/search-params";

import { CategoriesManager } from "./_components/categories-manager";

// Categories: add, rename, recolour, reorder and delete (archive). A category
// with no published shops stays here but is hidden on the site.
export default async function CategoriesPage() {
  const [{ active, archived, missingTable }, counts] = await Promise.all([getAdminCategories(), getCategoryCounts()]);

  const byValue: Record<string, { total: number; published: number }> = {};
  for (const c of counts?.byCategory ?? []) byValue[c.value] = { total: c.total, published: c.published };
  const known = new Set([...active, ...archived].map((c) => c.key));
  const invalid = (counts?.byCategory ?? []).filter((c) => !known.has(c.value)).sort((a, b) => b.total - a.total);
  const listHref = (category: string, onlyPublished = false) =>
    shopsHref(DEFAULT_SHOP_FILTERS, { category, ...(onlyPublished ? { published: "yes" as const } : {}) });
  const hrefs = Object.fromEntries(
    active.map((c) => [c.key, { all: listHref(c.key), published: listHref(c.key, true) }])
  );
  const published = active.reduce((sum, c) => sum + (byValue[c.key]?.published ?? 0), 0);
  const hidden = active.filter((c) => !byValue[c.key]?.published).length;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <p className="text-sm text-muted-foreground">
          {formatCount(published)} публикувани магазина в {active.length} категории
          {hidden ? ` · ${hidden} без публикувани магазини (скрити на сайта)` : ""}. Редът тук е редът на
          сайта; изтритите отиват в архива и могат да се възстановят.
        </p>
      </div>

      {missingTable ? (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          Таблицата с категории още не съществува. Пусни <code>sql/007_categories.sql</code> в Supabase SQL
          Editor, за да можеш да ги редактираш. Дотогава сайтът ползва вградените 18.
        </p>
      ) : null}

      <CategoriesManager
        active={active}
        archived={archived}
        counts={byValue}
        readOnly={missingTable}
        listHref={hrefs}
      />

      <p className="text-sm text-muted-foreground">
        Без категория: {formatCount(counts?.without.total ?? 0)} магазина. Те не могат да се публикуват.
      </p>

      {invalid.length ? (
        <section className="space-y-3 rounded-xl border border-destructive/40 p-4">
          <div>
            <h2 className="text-sm font-medium">Невалидни категории</h2>
            <p className="text-xs text-muted-foreground">
              Стойности, които не са категория от списъка. На сайта такъв магазин излиза като „Други“ и не се вижда в
              своята категория. Отвори магазините и избери категория.
            </p>
          </div>
          <ul className="space-y-1 text-sm">
            {invalid.map((c) => (
              <li key={c.value} className="flex items-center justify-between gap-3">
                <code>{c.value}</code>
                <Link href={listHref(c.value)} className="tabular-nums hover:underline">
                  {formatCount(c.total)} магазина{c.published ? ` · ${formatCount(c.published)} публикувани` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
