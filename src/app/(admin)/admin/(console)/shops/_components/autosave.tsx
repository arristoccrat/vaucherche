"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

export const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Saves a field when it loses focus (or at once for selects and suggestion
// buttons, via `change(value, true)`), never while typing, so the page does
// not re-render under the cursor. A value still unsaved when the field
// unmounts (the row is collapsed) is saved on the way out, and closing the
// tab with one asks first.
export function useAutosave(save: (value: string) => Promise<ActionResult<unknown>>, initial: string) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const saved = useRef(initial);
  const pending = useRef<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current !== null && pending.current.trim() !== saved.current.trim()) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      const unsaved = pending.current;
      if (unsaved !== null && unsaved.trim() !== saved.current.trim()) {
        void saveRef.current(unsaved).then((result) => {
          if (!result?.ok) toast.error(result?.error ?? "Промяната не е записана.");
        });
      }
    };
  }, []);

  const commit = async (next: string) => {
    pending.current = null;
    if (next.trim() === saved.current.trim()) return;
    setState("saving");
    try {
      const result = await saveRef.current(next);
      if (result?.ok) {
        saved.current = next;
        setState("saved");
      } else {
        pending.current = next;
        setState("error");
        toast.error(result?.error ?? "Няма отговор от сървъра.");
      }
    } catch {
      pending.current = next;
      setState("error");
      toast.error("Връзката със сървъра прекъсна. Промяната не е записана.");
    }
  };

  const change = (next: string, immediate = false) => {
    setValue(next);
    pending.current = next;
    if (immediate) void commit(next);
    else if (next.trim() !== saved.current.trim()) setState("idle");
  };

  const flush = () => {
    if (pending.current !== null) void commit(pending.current);
  };

  return { value, state, change, flush };
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
