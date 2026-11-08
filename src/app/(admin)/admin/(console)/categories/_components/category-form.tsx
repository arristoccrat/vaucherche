"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";
import { HEX_PATTERN, MIN_CONTRAST, onColorHex, textColorFor } from "@/lib/categories";
import { CATEGORY_ICON_NAMES, categoryIcon } from "@/lib/category-icons";
import type { CategoryInput } from "@/lib/category-input";
import { suggestPath } from "@/lib/category-input";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// Create or edit one category. The preview shows the band exactly as the
// site will, with the text colour picked automatically and the contrast.
export function CategoryForm({
  initial,
  isNew,
  onSubmit,
  onDone,
}: {
  initial: CategoryInput;
  isNew: boolean;
  onSubmit: (input: CategoryInput) => Promise<ActionResult<unknown>>;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(initial.label);
  const [path, setPath] = useState(initial.path);
  const [pathEdited, setPathEdited] = useState(!isNew);
  const [bg, setBg] = useState(initial.bg);
  const [icon, setIcon] = useState(initial.icon);
  const [pending, startTransition] = useTransition();

  const validHex = HEX_PATTERN.test(bg);
  const text = validHex ? textColorFor(bg) : null;
  const Icon = categoryIcon(icon);
  const pathChanged = !isNew && path !== initial.path;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await onSubmit({ label, path, bg, icon });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(isNew ? "Категорията е добавена." : "Записано.");
        onDone();
      } catch {
        toast.error("Връзката със сървъра прекъсна. Промяната не е записана.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-[1fr_220px]">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Име (на сайта)
          <Input
            value={label}
            maxLength={40}
            required
            onChange={(event) => {
              setLabel(event.target.value);
              if (!pathEdited) setPath(suggestPath(event.target.value));
            }}
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Адрес: /kategoriya/…
          <Input
            value={path}
            maxLength={40}
            required
            pattern="[a-z0-9][a-z0-9\-]*"
            onChange={(event) => {
              setPathEdited(true);
              setPath(event.target.value.toLowerCase());
            }}
          />
          {pathChanged ? (
            <span className="block text-amber-700 dark:text-amber-400">
              Старият адрес /kategoriya/{initial.path} ще пренасочва към новия.
            </span>
          ) : null}
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Цвят
          <span className="flex gap-2">
            <input
              type="color"
              value={validHex ? bg : "#000000"}
              onChange={(event) => setBg(event.target.value.toUpperCase())}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background"
              aria-label="Избери цвят"
            />
            <Input value={bg} maxLength={7} onChange={(event) => setBg(event.target.value)} />
          </span>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Иконка
          <select value={icon} onChange={(event) => setIcon(event.target.value)} className={fieldClass}>
            {CATEGORY_ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div
          className="flex h-[92px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-foreground/80"
          style={validHex && text ? { backgroundColor: bg, color: onColorHex(text.on) } : undefined}
        >
          <Icon className="size-5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label || "Име"}</span>
        </div>
        <p className={text?.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
          {!validHex
            ? "Цветът е във вида #RRGGBB."
            : text?.ok
              ? `Текст: ${text.on === "ink" ? "тъмен" : "бял"} · контраст ${text.ratio.toFixed(2)}:1`
              : `Контраст ${text?.ratio.toFixed(2)}:1, трябва поне ${MIN_CONTRAST}:1. Изберете по-тъмен или по-светъл цвят.`}
        </p>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending || !text?.ok}>
            {isNew ? "Добави" : "Запази"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDone} disabled={pending}>
            Отказ
          </Button>
        </div>
      </div>
    </form>
  );
}
