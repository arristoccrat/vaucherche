"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1000;

export const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Saves a field a second after typing stops, and immediately on blur (or on
// change for selects, via `change(value, true)`).
export function useAutosave(save: (value: string) => Promise<ActionResult<unknown>>, initial: string) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The latest typed value not yet saved. If the field unmounts first (the
  // row is collapsed within the debounce window), it is saved on the way out
  // instead of being dropped.
  const pending = useRef<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      const unsaved = pending.current;
      if (unsaved !== null && unsaved.trim() !== saved.current.trim()) {
        void saveRef.current(unsaved).then((result) => {
          if (!result?.ok) toast.error(result?.error ?? "Промяната не е записана.");
        });
      }
    },
    []
  );

  const commit = async (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    if (next.trim() === saved.current.trim()) return;
    setState("saving");
    try {
      const result = await saveRef.current(next);
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
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void commit(next);
    else timer.current = setTimeout(() => void commit(next), AUTOSAVE_DELAY_MS);
  };

  return { value, state, change, flush: () => void commit(value) };
}

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  return (
    <span className={cn("text-[11px]", state === "error" ? "text-destructive" : "text-muted-foreground")}>
      {state === "saving" ? "Записване…" : state === "saved" ? "Записано ✓" : "Грешка"}
    </span>
  );
}

export function FieldLabel({
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
