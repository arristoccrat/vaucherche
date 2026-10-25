"use client";

import { useState } from "react";

import type { Json } from "@/lib/database.types";
import type { ProductRaw } from "@/lib/product-raw";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; data: ProductRaw };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("bg-BG") : "—";
}

function JsonBlock({ label, value }: { label: string; value: Json | null }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-2 text-xs">
        {value == null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// Merchant copy is reference material, never listing text, and always plain
// text: some crawled pages carried injected scripts. React escapes these
// strings; nothing here may use dangerouslySetInnerHTML.
function MerchantText({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">
        {label}{" "}
        <span className="rounded bg-amber-100 px-1 text-[10px] uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          текст на търговеца · само за справка
        </span>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-2 text-xs dark:border-amber-900 dark:bg-amber-950/20">
        {value || "—"}
      </pre>
    </div>
  );
}

export function RawDrawer({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  // Loaded on first open, from a click handler, never with the list.
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || state.kind === "loaded" || state.kind === "loading") return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/admin/api/products/${productId}/raw`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" && body && "error" in body ? String(body.error) : response.statusText;
        setState({ kind: "error", message });
        return;
      }
      setState({ kind: "loaded", data: body as ProductRaw });
    } catch {
      setState({ kind: "error", message: "Неуспешно зареждане." });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        {open ? "Скрий суровите данни" : "Сурови данни"}
      </button>
      {open ? (
        <div className="mt-2 space-y-3 rounded-md border bg-background p-3">
          {state.kind === "loading" || state.kind === "idle" ? (
            <p className="text-xs text-muted-foreground">Зареждане…</p>
          ) : state.kind === "error" ? (
            <p className="text-xs text-destructive">{state.message}</p>
          ) : (
            <>
              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div>Изтеглено: {formatDate(state.data.fetched_at)}</div>
                <div>Открито: {formatDate(state.data.found_at)}</div>
                <div className="sm:col-span-2">Breadcrumb: {state.data.breadcrumb || "—"}</div>
              </div>
              <MerchantText label="Описание" value={state.data.description} />
              <JsonBlock label="Meta (Open Graph / JSON-LD)" value={state.data.meta} />
              <JsonBlock label="Връзки" value={state.data.links} />
              <MerchantText label="Текст от страницата (raw_text)" value={state.data.raw_text} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
