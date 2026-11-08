import Link from "next/link";

import { CATEGORIES, CATEGORY_KEYS, isCategoryKey } from "@/lib/categories";
import { formatCount } from "@/lib/format";
import { getCategoryCounts } from "@/lib/queries/shops";
import { DEFAULT_SHOP_FILTERS, shopsHref } from "@/lib/search-params";

// The 18 site categories with how many shops each has, and how many of
// those are on the site. The categories themselves live in
// src/lib/categories.ts (names, colours and URLs are code, not data).
export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  if (!counts) {
    return <p className="text-sm text-muted-foreground">Броят по категории не е наличен.</p>;
  }

  const byValue = new Map(counts.byCategory.map((c) => [c.value, c]));
  const rows = CATEGORY_KEYS.map((key) => ({ key, ...(byValue.get(key) ?? { total: 0, published: 0 }) }));
  const invalid = counts.byCategory.filter((c) => !isCategoryKey(c.value)).sort((a, b) => b.total - a.total);
  const published = rows.reduce((sum, r) => sum + r.published, 0);
  const emptyOnSite = rows.filter((r) => r.published === 0).length;
  const listHref = (category: string, onlyPublished = false) =>
    shopsHref(DEFAULT_SHOP_FILTERS, { category, ...(onlyPublished ? { published: "yes" as const } : {}) });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <p className="text-sm text-muted-foreground">
          {formatCount(published)} публикувани магазина в 18 категории
          {emptyOnSite ? ` · ${emptyOnSite} категории са празни на сайта` : ""}. Имената, цветовете и адресите
          на категориите са в кода; категорията на магазин се сменя от редакцията му.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="border-b text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">Категория</th>
            <th className="py-2 pr-3 font-medium">Ключ · адрес на сайта</th>
            <th className="py-2 pr-3 text-right font-medium">Магазини</th>
            <th className="py-2 text-right font-medium">Публикувани</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => {
            const category = CATEGORIES[row.key];
            return (
              <tr key={row.key}>
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-3 shrink-0 rounded-sm border" style={{ backgroundColor: category.bg }} />
                    {category.label}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs text-muted-foreground">
                  <code>{row.key}</code> ·{" "}
                  <a href={`/kategoriya/${category.path}`} target="_blank" rel="noopener" className="hover:underline">
                    /kategoriya/{category.path} ↗
                  </a>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {row.total ? (
                    <Link href={listHref(row.key)} className="hover:underline">
                      {formatCount(row.total)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {row.published ? (
                    <Link href={listHref(row.key, true)} className="hover:underline">
                      {formatCount(row.published)}
                    </Link>
                  ) : (
                    <span className="text-destructive">0</span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="text-muted-foreground">
            <td className="py-2 pr-3">Без категория</td>
            <td className="py-2 pr-3 text-xs">не може да се публикува</td>
            <td className="py-2 pr-3 text-right tabular-nums">{formatCount(counts.without.total)}</td>
            <td className="py-2 text-right tabular-nums">{formatCount(counts.without.published)}</td>
          </tr>
        </tbody>
      </table>

      {invalid.length ? (
        <section className="space-y-3 rounded-xl border border-destructive/40 p-4">
          <div>
            <h2 className="text-sm font-medium">Невалидни категории</h2>
            <p className="text-xs text-muted-foreground">
              Стойности извън 18-те категории. На сайта такъв магазин излиза като „Други“ и не се вижда в своята
              категория. Отвори магазините и избери категория от списъка.
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
