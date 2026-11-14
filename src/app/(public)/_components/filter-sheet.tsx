"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Mobile filters: a button that opens a sheet from the bottom, a little over
// half the screen tall, holding the same groups as the desktop rail. Each
// choice navigates (the URL is the state) and the sheet stays open, so
// several can be picked; "Покажи" closes it on the updated list.
export function FilterSheet({
  activeCount,
  resultLabel,
  children,
}: {
  activeCount: number;
  // "24 магазина": what the current filters show, from the server.
  resultLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-ink bg-brand-card pl-4 pr-3 font-ui text-sm font-bold text-brand-ink"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Филтри
        {activeCount ? (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-amber font-num text-[12px] font-semibold">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Затвори филтрите"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="sheet-fade absolute inset-0 bg-brand-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Филтри"
            className="sheet-up absolute inset-x-0 bottom-0 flex max-h-[62dvh] flex-col rounded-t-[24px] border-t-2 border-brand-ink bg-brand-ground"
          >
            <div className="flex items-center justify-between border-b-2 border-brand-hair px-5 pb-2 pt-3">
              <h2 className="font-display text-[16px] font-bold text-brand-ink">Филтри</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Затвори"
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-brand-ink hover:bg-brand-card"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1">{children}</div>
            <div className="border-t-2 border-brand-hair px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-full border-2 border-brand-ink bg-brand-amber font-ui text-[15px] font-extrabold text-brand-ink"
              >
                Покажи <span className="ml-1.5 font-num">{resultLabel}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
