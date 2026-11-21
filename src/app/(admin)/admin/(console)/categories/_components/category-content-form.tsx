"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateCategoryContent } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { MAX_FAQ, MAX_INTRO, type CategoryContent, type FaqItem } from "@/lib/category-content";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// The copy on a category's public page (sql/018): an intro under the heading
// and questions with answers at the bottom (also given to Google as FAQ
// data). Saved together with "Запази"; our own words, never a shop's text.
export function CategoryContentForm({
  categoryKey,
  label,
  initial,
  onDone,
}: {
  categoryKey: string;
  label: string;
  initial: CategoryContent;
  onDone: () => void;
}) {
  const [intro, setIntro] = useState(initial.intro);
  const [faq, setFaq] = useState<FaqItem[]>(initial.faq);
  const [pending, startTransition] = useTransition();

  const setItem = (i: number, patch: Partial<FaqItem>) => setFaq((items) => items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const save = () =>
    startTransition(async () => {
      try {
        // Rows left completely empty are dropped rather than refused.
        const items = faq.filter((it) => it.q.trim() || it.a.trim());
        const result = await updateCategoryContent(categoryKey, { intro, faq: items });
        if (!result.ok) return void toast.error(result.error);
        toast.success("Текстът е записан.");
        onDone();
      } catch {
        toast.error("Връзката със сървъра прекъсна. Нищо не е записано.");
      }
    });

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="text-sm font-medium">Текст на страницата: {label}</div>

      <label className="block space-y-1">
        <span className="flex items-baseline justify-between text-xs font-medium">
          Въведение под заглавието
          <span className="font-normal text-muted-foreground">
            {intro.length}/{MAX_INTRO} · празен ред = нов абзац, **удебелено**
          </span>
        </span>
        <textarea
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          maxLength={MAX_INTRO}
          rows={4}
          placeholder="2–3 изречения за какво са ваучерите в тази категория, за кого са подходящи и какво да имаш предвид."
          className={fieldClass}
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs font-medium">
          Въпроси и отговори
          <span className="font-normal text-muted-foreground">
            {faq.length}/{MAX_FAQ} · най-долу на страницата и в Google
          </span>
        </div>
        {faq.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-md border bg-background p-2">
            <div className="flex-1 space-y-1.5">
              <input
                value={item.q}
                onChange={(event) => setItem(i, { q: event.target.value })}
                maxLength={200}
                placeholder="Въпрос, напр. Колко е валиден ваучерът?"
                aria-label={`Въпрос ${i + 1}`}
                className={fieldClass}
              />
              <textarea
                value={item.a}
                onChange={(event) => setItem(i, { a: event.target.value })}
                maxLength={1000}
                rows={2}
                placeholder="Отговор"
                aria-label={`Отговор ${i + 1}`}
                className={fieldClass}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-8 p-0"
              aria-label="Махни въпроса"
              onClick={() => setFaq((items) => items.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {faq.length < MAX_FAQ ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setFaq((items) => [...items, { q: "", a: "" }])}>
            <Plus /> Добави въпрос
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          Запази
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onDone}>
          Откажи
        </Button>
      </div>
    </div>
  );
}
