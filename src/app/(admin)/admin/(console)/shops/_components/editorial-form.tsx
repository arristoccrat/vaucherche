"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  updateShopEditorial,
  type EditorialField,
} from "@/actions/editorial";
import { GIFT_APPEALS, GIFT_APPEAL_LABELS, isGiftAppeal } from "@/lib/domain";
import type { ShopListRow } from "@/lib/queries/shops";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1000;

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Saves a field a second after typing stops, and immediately on blur.
function useAutosave(shopId: string, field: EditorialField, initial: string) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const save = async (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (next.trim() === saved.current.trim()) return;
    setState("saving");
    try {
      const result = await updateShopEditorial(shopId, { [field]: next });
      if (result?.ok) {
        saved.current = next;
        setState("saved");
      } else {
        setState("error");
        toast.error(result?.error ?? "Няма отговор от сървъра.");
      }
    } catch {
      setState("error");
      toast.error("Връзката със сървъра прекъсна. Промяната не е записана.");
    }
  };

  const change = (next: string, immediate = false) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void save(next);
    else timer.current = setTimeout(() => void save(next), AUTOSAVE_DELAY_MS);
  };

  return { value, state, change, flush: () => void save(value) };
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  return (
    <span
      className={cn(
        "text-[11px]",
        state === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {state === "saving" ? "Записване…" : state === "saved" ? "Записано ✓" : "Грешка"}
    </span>
  );
}

function FieldLabel({
  htmlFor,
  label,
  hint,
  state,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  state: SaveState;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
        {hint ? <span className="ml-1 font-normal text-muted-foreground">{hint}</span> : null}
      </label>
      <SaveIndicator state={state} />
    </div>
  );
}

function TextField({
  shopId,
  field,
  label,
  hint,
  initial,
  placeholder,
  listId,
}: {
  shopId: string;
  field: EditorialField;
  label: string;
  hint?: string;
  initial: string;
  placeholder?: string;
  listId?: string;
}) {
  const { value, state, change, flush } = useAutosave(shopId, field, initial);
  const id = `${field}-${shopId}`;
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} hint={hint} state={state} />
      <input
        id={id}
        value={value}
        list={listId}
        placeholder={placeholder}
        onChange={(event) => change(event.target.value)}
        onBlur={flush}
        className={fieldClass}
      />
    </div>
  );
}

export function EditorialForm({
  shop,
  categories,
}: {
  shop: ShopListRow;
  categories: string[];
}) {
  const id = shop.id;
  const description = useAutosave(id, "description", shop.description ?? "");
  const appeal = useAutosave(id, "gift_appeal", shop.gift_appeal ?? "");
  const logo = shop.logo_url;
  const appealOptions = Array.from(
    new Set([...GIFT_APPEALS, ...(shop.gift_appeal ? [shop.gift_appeal] : [])])
  );

  return (
    <div className="space-y-3 border-t px-4 py-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold">Редакция</h3>
        <span className="text-xs text-muted-foreground">
          Записва се автоматично. Пишете собствен текст по фактите — не копирайте описанието на търговеца.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <TextField
            shopId={id}
            field="name"
            label="Име"
            hint="както го пише човек, не домейнът"
            initial={shop.name === shop.domain ? "" : shop.name}
            placeholder={shop.domain}
          />
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
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              shopId={id}
              field="category"
              label="Категория"
              initial={shop.category ?? ""}
              listId={`categories-${id}`}
            />
            <TextField
              shopId={id}
              field="subcategory"
              label="Подкатегория"
              initial={shop.subcategory ?? ""}
            />
          </div>
          <datalist id={`categories-${id}`}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <div className="space-y-1">
            <FieldLabel
              htmlFor={`gift_appeal-${id}`}
              label="Подаръчна привлекателност"
              hint="подрежда началната страница"
              state={appeal.state}
            />
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

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                shopId={id}
                field="logo_url"
                label="Лого (URL)"
                hint="замества favicon"
                initial={logo ?? ""}
                placeholder="https://…/logo.png"
              />
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
              {logo ? (
                // External merchant logo; a plain img avoids next/image domain config.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(shop.domain)}&sz=64`}
                  alt=""
                  className="size-5 opacity-70"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
