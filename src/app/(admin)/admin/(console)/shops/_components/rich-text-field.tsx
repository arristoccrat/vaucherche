"use client";

import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useRef, useState } from "react";

import { RichText } from "@/components/rich-text";
import { toggleList, toggleWrap, type Edit } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

import { FieldLabel, fieldClass, type useAutosave } from "./autosave";

const toolButton =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40";

// The voucher description: a textarea in the simple format of
// src/lib/rich-text.ts, with buttons for bold, italic and lists (Ctrl/Cmd+B,
// Ctrl/Cmd+I) and a preview rendered exactly as on the shop page.
export function RichTextField({
  id,
  label,
  hint,
  placeholder,
  maxLength,
  field,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  maxLength: number;
  field: ReturnType<typeof useAutosave>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const apply = (edit: (value: string, start: number, end: number) => Edit) => {
    const el = ref.current;
    if (!el) return;
    const next = edit(field.value, el.selectionStart, el.selectionEnd);
    if (next.value.length > maxLength) return;
    field.change(next.value);
    // Put the selection back on the same words once React has re-rendered.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.start, next.end);
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b" || key === "i") {
      event.preventDefault();
      apply((v, s, e) => toggleWrap(v, s, e, key === "b" ? "**" : "*"));
    }
  };

  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} hint={hint} state={field.state} />
      <div className="rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <div className="flex flex-wrap items-center gap-0.5 border-b px-1 py-1" role="toolbar" aria-label="Форматиране">
          <button type="button" className={toolButton} disabled={preview} onClick={() => apply((v, s, e) => toggleWrap(v, s, e, "**"))} title="Удебелен (Ctrl+B)">
            <Bold className="size-3.5" aria-hidden />
            <span className="sr-only">Удебелен</span>
          </button>
          <button type="button" className={toolButton} disabled={preview} onClick={() => apply((v, s, e) => toggleWrap(v, s, e, "*"))} title="Курсив (Ctrl+I)">
            <Italic className="size-3.5" aria-hidden />
            <span className="sr-only">Курсив</span>
          </button>
          <button type="button" className={toolButton} disabled={preview} onClick={() => apply((v, s, e) => toggleList(v, s, e, "ul"))} title="Списък с точки">
            <List className="size-3.5" aria-hidden />
            <span className="sr-only">Списък с точки</span>
          </button>
          <button type="button" className={toolButton} disabled={preview} onClick={() => apply((v, s, e) => toggleList(v, s, e, "ol"))} title="Номериран списък">
            <ListOrdered className="size-3.5" aria-hidden />
            <span className="sr-only">Номериран списък</span>
          </button>
          <button
            type="button"
            className={cn(toolButton, "ml-auto", preview && "bg-accent text-foreground")}
            aria-pressed={preview}
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Редактирай" : "Преглед"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[9.5rem] px-3 py-2 text-sm leading-relaxed">
            {field.value.trim() ? (
              <RichText source={field.value} />
            ) : (
              <p className="text-muted-foreground">Няма текст.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={ref}
            id={id}
            value={field.value}
            rows={8}
            maxLength={maxLength}
            onChange={(event) => field.change(event.target.value)}
            onBlur={field.flush}
            onKeyDown={onKeyDown}
            className={cn(fieldClass, "rounded-none border-0 shadow-none focus-visible:ring-0")}
            placeholder={placeholder}
          />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        **удебелен** · *курсив* · ред с „- “ е точка от списък, с „1. “ номер · празен ред е нов абзац
      </p>
    </div>
  );
}
