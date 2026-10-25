"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { updateShopEditorial, type EditorialField } from "@/actions/editorial";
import { Button } from "@/components/ui/button";
import { GIFT_APPEALS, GIFT_APPEAL_LABELS, isGiftAppeal } from "@/lib/domain";
import type { ShopListRow } from "@/lib/queries/shops";
import type { CrawlSuggestions } from "@/lib/suggestions";

import { FieldLabel, fieldClass, useAutosave } from "./autosave";
import { ImagePicker } from "./image-picker";

type SuggestionsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; data: CrawlSuggestions };

function useEditorial(shopId: string, field: EditorialField, initial: string) {
  return useAutosave((value) => updateShopEditorial(shopId, { [field]: value }), initial);
}

function TextField({
  id,
  label,
  hint,
  placeholder,
  field,
  listId,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  field: ReturnType<typeof useAutosave>;
  listId?: string;
}) {
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} hint={hint} state={field.state} />
      <input
        id={id}
        value={field.value}
        list={listId}
        placeholder={placeholder}
        onChange={(event) => field.change(event.target.value)}
        onBlur={field.flush}
        className={fieldClass}
      />
    </div>
  );
}

export function EditorialForm({ shop, categories }: { shop: ShopListRow; categories: string[] }) {
  const id = shop.id;
  const name = useEditorial(id, "name", shop.name === shop.domain ? "" : shop.name);
  const description = useEditorial(id, "description", shop.description ?? "");
  const category = useEditorial(id, "category", shop.category ?? "");
  const subcategory = useEditorial(id, "subcategory", shop.subcategory ?? "");
  const appeal = useEditorial(id, "gift_appeal", shop.gift_appeal ?? "");
  const [suggestions, setSuggestions] = useState<SuggestionsState>({ kind: "idle" });

  const appealOptions = Array.from(new Set([...GIFT_APPEALS, ...(shop.gift_appeal ? [shop.gift_appeal] : [])]));
  const loaded = suggestions.kind === "loaded" ? suggestions.data : null;

  // Loaded on request from a click, not on render.
  const loadSuggestions = async () => {
    setSuggestions({ kind: "loading" });
    try {
      const response = await fetch(`/admin/api/shops/${id}/suggestions`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body && "error" in body ? String(body.error) : response.statusText;
        setSuggestions({ kind: "error", message });
        return;
      }
      setSuggestions({ kind: "loaded", data: body as CrawlSuggestions });
    } catch {
      setSuggestions({ kind: "error", message: "Неуспешно зареждане." });
    }
  };

  return (
    <div className="space-y-4 border-t px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">Редакция</h3>
        <span className="text-xs text-muted-foreground">
          Записва се автоматично. Пишете собствен текст по фактите — не копирайте описанието на търговеца.
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={suggestions.kind === "loading"}
          onClick={loadSuggestions}
        >
          <Sparkles />
          {suggestions.kind === "loading" ? "Зареждане…" : loaded ? "Обнови предложенията" : "Предложения от обхождането"}
        </Button>
      </div>
      {suggestions.kind === "error" ? <p className="text-xs text-destructive">{suggestions.message}</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1">
            <TextField id={`name-${id}`} label="Име" hint="както го пише човек, не домейнът" placeholder={shop.domain} field={name} />
            {loaded ? (
              loaded.names.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {loaded.names.map((s) => (
                    <li key={s.value}>
                      <button
                        type="button"
                        title={s.source}
                        onClick={() => name.change(s.value, true)}
                        className="rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-accent"
                      >
                        {s.value}
                        {s.count > 1 ? <span className="ml-1 text-muted-foreground">×{s.count}</span> : null}
                        <span className="ml-1.5 font-medium text-primary">Използвай</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground">Няма предложено име от обхождането.</p>
              )
            ) : null}
          </div>

          <div className="space-y-1">
            <FieldLabel
              htmlFor={`description-${id}`}
              label="Описание"
              hint={`две изречения · ${description.value.trim().length}/600`}
              state={description.state}
            />
            <textarea
              id={`description-${id}`}
              value={description.value}
              rows={3}
              maxLength={600}
              onChange={(event) => description.change(event.target.value)}
              onBlur={description.flush}
              className={fieldClass}
              placeholder="Напр.: Подаръчни ваучери за масажи и СПА процедури в София. Изберете сума от 25 до 150 €, валидни 12 месеца."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField id={`category-${id}`} label="Категория" field={category} listId={`categories-${id}`} />
            <TextField id={`subcategory-${id}`} label="Подкатегория" field={subcategory} />
          </div>
          <datalist id={`categories-${id}`}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="space-y-1">
            <FieldLabel htmlFor={`gift_appeal-${id}`} label="Подаръчна привлекателност" hint="подрежда началната страница" state={appeal.state} />
            <select
              id={`gift_appeal-${id}`}
              value={appeal.value}
              onChange={(event) => appeal.change(event.target.value, true)}
              className={fieldClass}
            >
              <option value="">—</option>
              {appealOptions.map((value) => (
                <option key={value} value={value}>
                  {isGiftAppeal(value) ? GIFT_APPEAL_LABELS[value] : value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-5">
          <ImagePicker shopId={id} kind="logo" url={shop.logo_url} suggestions={loaded?.logos ?? null} />
          <ImagePicker shopId={id} kind="cover" url={shop.cover_url} suggestions={loaded?.covers ?? null} />
        </div>
      </div>
    </div>
  );
}
