"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  archiveCategory,
  createCategory,
  moveCategory,
  restoreCategory,
  updateCategory,
} from "@/actions/categories";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { Category } from "@/lib/categories";
import { formatCount } from "@/lib/format";

import { CategoryForm } from "./category-form";

type Counts = Record<string, { total: number; published: number }>;
type Archived = Category & { archivedAt: string };

const fieldClass =
  "h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult<unknown>>, success: string, after?: () => void) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(success);
        after?.();
      } catch {
        toast.error("Връзката със сървъра прекъсна. Промяната не е записана.");
      }
    });
  return { pending, run };
}

function ArchivePanel({
  category,
  shops,
  others,
  onClose,
}: {
  category: Category;
  shops: number;
  others: Category[];
  onClose: () => void;
}) {
  const [moveTo, setMoveTo] = useState("");
  const { pending, run } = useRun();
  return (
    <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p>
        Изтриване на „{category.label}“: категорията изчезва от сайта и от списъците. Може да се възстанови от архива
        долу.
      </p>
      {shops ? (
        <label className="flex flex-wrap items-center gap-2">
          {formatCount(shops)} магазина отиват в
          <select value={moveTo} onChange={(event) => setMoveTo(event.target.value)} className={fieldClass}>
            <option value="">— избери категория —</option>
            {others.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-muted-foreground">В нея няма магазини.</p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={pending || (shops > 0 && !moveTo)}
          onClick={() =>
            run(() => archiveCategory(category.key, moveTo || null), `„${category.label}“ е изтрита.`, onClose)
          }
        >
          Изтрий
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} disabled={pending}>
          Отказ
        </Button>
      </div>
    </div>
  );
}

export function CategoriesManager({
  active,
  archived,
  counts,
  readOnly,
  listHref,
}: {
  active: Category[];
  archived: Archived[];
  counts: Counts;
  readOnly: boolean;
  listHref: Record<string, { all: string; published: string }>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { pending, run } = useRun();

  return (
    <div className="space-y-6">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">Категория</th>
            <th className="py-2 pr-3 font-medium">Адрес на сайта</th>
            <th className="py-2 pr-3 text-right font-medium">Магазини</th>
            <th className="py-2 pr-3 text-right font-medium">Публикувани</th>
            <th className="py-2 text-right font-medium">
              <span className="sr-only">Действия</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {active.map((category, i) => {
            const count = counts[category.key] ?? { total: 0, published: 0 };
            if (editing === category.key) {
              return (
                <tr key={category.key}>
                  <td colSpan={5} className="py-3">
                    <CategoryForm
                      isNew={false}
                      initial={{ label: category.label, path: category.path, bg: category.bg, icon: category.icon }}
                      onSubmit={(input) => updateCategory(category.key, input)}
                      onDone={() => setEditing(null)}
                    />
                  </td>
                </tr>
              );
            }
            return (
              <tr key={category.key} className="align-top">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-3 shrink-0 rounded-sm border" style={{ backgroundColor: category.bg }} />
                    {category.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ключ <code>{category.key}</code>
                  </span>
                  {archiving === category.key ? (
                    <div className="mt-2">
                      <ArchivePanel
                        category={category}
                        shops={count.total}
                        others={active.filter((c) => c.key !== category.key)}
                        onClose={() => setArchiving(null)}
                      />
                    </div>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-xs text-muted-foreground">
                  {count.published ? (
                    <a href={`/kategoriya/${category.path}`} target="_blank" rel="noopener" className="hover:underline">
                      /kategoriya/{category.path} ↗
                    </a>
                  ) : (
                    <span title="Без публикувани магазини категорията не се показва на сайта">
                      /kategoriya/{category.path} · скрита на сайта
                    </span>
                  )}
                  {category.previousPaths.length ? (
                    <span className="block">пренасочва от: {category.previousPaths.join(", ")}</span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {count.total ? (
                    <Link href={listHref[category.key].all} className="hover:underline">
                      {formatCount(count.total)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {count.published ? (
                    <Link href={listHref[category.key].published} className="hover:underline">
                      {formatCount(count.published)}
                    </Link>
                  ) : (
                    <span className="text-destructive">0</span>
                  )}
                </td>
                <td className="py-1.5 text-right">
                  {readOnly ? null : (
                    <span className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0"
                        aria-label="Нагоре"
                        disabled={pending || i === 0}
                        onClick={() => run(() => moveCategory(category.key, "up"), "Подредено.")}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0"
                        aria-label="Надолу"
                        disabled={pending || i === active.length - 1}
                        onClick={() => run(() => moveCategory(category.key, "down"), "Подредено.")}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(category.key)}>
                        Редактирай
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setArchiving(category.key)}>
                        Изтрий
                      </Button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {readOnly ? null : adding ? (
        <CategoryForm
          isNew
          initial={{ label: "", path: "", bg: "#1A4FD6", icon: "Gift" }}
          onSubmit={(input) => createCategory(input)}
          onDone={() => setAdding(false)}
        />
      ) : (
        <Button onClick={() => setAdding(true)}>Нова категория</Button>
      )}

      {archived.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Изтрити (архив)</h2>
          <ul className="divide-y rounded-lg border text-sm">
            {archived.map((category) => (
              <li key={category.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="size-3 shrink-0 rounded-sm border" style={{ backgroundColor: category.bg }} />
                  {category.label}
                  <span className="text-xs text-muted-foreground">
                    <code>{category.key}</code> · изтрита {new Date(category.archivedAt).toLocaleDateString("bg-BG")}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => restoreCategory(category.key), `„${category.label}“ е възстановена.`)}
                >
                  Възстанови
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
