"use client";

import { BadgeCheck } from "lucide-react";
import {
  Fragment,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  bulkSetPublished,
  bulkSetStatus,
  setPublished,
  setStatus,
  type BulkTarget,
} from "@/actions/shops";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { GIFT_APPEAL_LABELS, isGiftAppeal, type ShopStatus } from "@/lib/domain";
import { formatConfidence, formatCount, parseStatusReason } from "@/lib/format";
import { publishChecks } from "@/lib/publish";
import type { ShopListRow } from "@/lib/queries/shops";
import { cn } from "@/lib/utils";

import { PriceCell } from "./price-cell";
import { ShopDetail, type ShopActions } from "./shop-detail";

type Counted = { updated: number; skipped: number };
type Patch = Partial<Pick<ShopListRow, "status" | "status_reason" | "published">>;
type OptimisticUpdate = { ids: string[]; patch: Patch };

type BulkOp = {
  label: string;
  verb: string;
  patch: Patch;
  run: (target: BulkTarget) => Promise<ActionResult<Counted>>;
};

const BULK_OPS: BulkOp[] = [
  {
    label: "Потвърди",
    verb: "потвърдят",
    patch: { status: "confirmed", status_reason: "потвърден от човек" },
    run: (t) => bulkSetStatus(t, "confirmed"),
  },
  {
    label: "Отхвърли",
    verb: "отхвърлят",
    patch: { status: "rejected", status_reason: "отхвърлен от човек" },
    run: (t) => bulkSetStatus(t, "rejected"),
  },
  {
    label: "За преглед",
    verb: "върнат за преглед",
    patch: { status: "needs_review" },
    run: (t) => bulkSetStatus(t, "needs_review"),
  },
  {
    label: "Публикувай",
    verb: "публикуват (само отговарящите на условията)",
    patch: {},
    run: (t) => bulkSetPublished(t, true),
  },
  {
    label: "Свали от сайта",
    verb: "свалят от сайта",
    patch: { published: false },
    run: (t) => bulkSetPublished(t, false),
  },
];

// Shortcuts only fire when the user is not typing somewhere.
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input:not([type="checkbox"]), textarea, select, [contenteditable="true"], dialog'
      )
    )
  );
}

function resultMessage({ updated, skipped }: Counted) {
  return skipped
    ? `Обновени: ${formatCount(updated)} · пропуснати: ${formatCount(skipped)} (не отговарят на условията)`
    : `Обновени: ${formatCount(updated)}`;
}

// The queue's work list: what is still missing before a shop can go live.
function PublishChecklistInline({
  shop,
  onPublish,
}: {
  shop: ShopListRow;
  onPublish: () => void;
}) {
  const missing = publishChecks(shop).filter((check) => !check.ok);
  if (!missing.length) {
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
        ✓ Готов за публикуване
        <Button size="sm" className="h-6 px-2 text-xs" onClick={onPublish}>
          Публикувай
        </Button>
      </div>
    );
  }
  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-rose-600 dark:text-rose-400">
      {missing.map((check) => (
        <li key={check.label}>✗ {check.label}</li>
      ))}
    </ul>
  );
}

export function ShopsBrowser({
  rows,
  total,
  filterQuery,
  categories,
  showPublishChecklist = false,
}: {
  rows: ShopListRow[];
  total: number;
  filterQuery: string;
  categories: string[];
  showPublishChecklist?: boolean;
}) {
  const [optimisticRows, applyOptimistic] = useOptimistic(
    rows,
    (state, update: OptimisticUpdate) =>
      state.map((row) =>
        update.ids.includes(row.id) ? { ...row, ...update.patch } : row
      )
  );
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(rows[0]?.id ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingBulk, setPendingBulk] = useState<BulkOp | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const lastIndex = useRef(0);

  // A new filter is a new working set.
  useEffect(() => {
    setSelected(new Set());
    setAllMatching(false);
  }, [filterQuery]);

  // Track focus by id; if the focused row left the list (e.g. confirmed while
  // filtering to needs_review), the row now in its place takes focus.
  let focusedIndex = optimisticRows.findIndex((r) => r.id === focusedId);
  if (focusedIndex === -1 && optimisticRows.length) {
    focusedIndex = Math.min(lastIndex.current, optimisticRows.length - 1);
  }
  const focusedRow = focusedIndex >= 0 ? optimisticRows[focusedIndex] : null;
  useEffect(() => {
    lastIndex.current = Math.max(focusedIndex, 0);
  });

  useEffect(() => {
    if (focusedRow) rowRefs.current.get(focusedRow.id)?.scrollIntoView({ block: "nearest" });
  }, [focusedRow]);

  const move = (delta: number) => {
    if (!optimisticRows.length) return;
    const next = Math.min(Math.max(focusedIndex + delta, 0), optimisticRows.length - 1);
    setFocusedId(optimisticRows[next].id);
  };

  const run = (
    ids: string[],
    patch: Patch,
    call: () => Promise<ActionResult<Counted>>,
    onSuccess?: (data: Counted) => void
  ) =>
    startTransition(async () => {
      applyOptimistic({ ids, patch });
      try {
        const result = await call();
        if (!result) toast.error("Няма отговор от сървъра. Презаредете страницата.");
        else if (result.ok) onSuccess?.(result.data);
        else toast.error(result.error);
      } catch {
        toast.error("Връзката със сървъра прекъсна. Промяната не е записана.");
      }
    });

  const actionsFor = (shop: ShopListRow): ShopActions => {
    const index = optimisticRows.findIndex((r) => r.id === shop.id);
    const nextId = optimisticRows[index + 1]?.id ?? shop.id;
    const publishTo = (publish: boolean) => {
      if (publish) {
        const missing = publishChecks(shop).filter((c) => !c.ok);
        if (missing.length) {
          toast.error(`Не може да се публикува: ${missing.map((c) => c.label).join("; ")}.`);
          return;
        }
      }
      run([shop.id], { published: publish }, () => setPublished(shop.id, publish), () =>
        toast.success(publish ? "Публикуван" : "Свален от сайта")
      );
    };
    const verdict = (status: ShopStatus, reason: string) => () => {
      run([shop.id], { status, status_reason: reason }, () => setStatus(shop.id, status));
      setFocusedId(nextId);
      if (expandedId === shop.id) setExpandedId(nextId);
    };

    return {
      confirm: verdict("confirmed", "потвърден от човек"),
      reject: verdict("rejected", "отхвърлен от човек"),
      skip: () => {
        setFocusedId(nextId);
        if (expandedId === shop.id) setExpandedId(nextId);
      },
      setPublished: publishTo,
      togglePublished: () => publishTo(!shop.published),
      open: () => {
        window.open(shop.voucher_url ?? `https://${shop.domain}`, "_blank", "noopener,noreferrer");
      },
    };
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!focusedRow) return;
    const actions = actionsFor(focusedRow);
    const handlers: Record<string, () => void> = {
      j: () => move(1),
      ArrowDown: () => move(1),
      k: () => move(-1),
      ArrowUp: () => move(-1),
      "1": actions.confirm,
      "2": actions.reject,
      "3": actions.skip,
      o: actions.open,
      Enter: () => setExpandedId(expandedId === focusedRow.id ? null : focusedRow.id),
      x: () => toggleOne(focusedRow.id),
    };
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  const toggleOne = (id: string) => {
    setAllMatching(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageIds = optimisticRows.map((r) => r.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectionCount = allMatching ? total : selected.size;

  const togglePage = () => {
    setAllMatching(false);
    setSelected(pageAllSelected ? new Set() : new Set(pageIds));
  };

  const askBulk = (op: BulkOp) => {
    setPendingBulk(op);
    dialogRef.current?.showModal();
  };

  const confirmBulk = () => {
    const op = pendingBulk;
    dialogRef.current?.close();
    if (!op) return;
    const target: BulkTarget = allMatching
      ? { kind: "filter", query: filterQuery }
      : { kind: "ids", ids: Array.from(selected) };
    const visible = allMatching ? pageIds : pageIds.filter((id) => selected.has(id));
    run(visible, op.patch, () => op.run(target), (data) => {
      toast.success(resultMessage(data));
      setSelected(new Set());
      setAllMatching(false);
    });
  };

  if (!optimisticRows.length) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Няма магазини, които отговарят на филтрите.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {selectionCount > 0 ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
          <span className="px-2 text-sm font-medium tabular-nums">
            {allMatching
              ? `Всички ${formatCount(total)} по филтъра`
              : `Избрани: ${formatCount(selected.size)}`}
          </span>
          {!allMatching && pageAllSelected && total > pageIds.length ? (
            <Button size="sm" variant="link" onClick={() => setAllMatching(true)}>
              Избери всички {formatCount(total)} по този филтър
            </Button>
          ) : null}
          <div className="ml-auto flex flex-wrap gap-2">
            {BULK_OPS.map((op) => (
              <Button key={op.label} size="sm" variant="outline" onClick={() => askBulk(op)}>
                {op.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(new Set());
                setAllMatching(false);
              }}
            >
              Откажи
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Клавиши (кликнете в таблицата): <kbd>j</kbd>/<kbd>k</kbd> движение ·{" "}
        <kbd>Enter</kbd> детайли · <kbd>1</kbd> потвърди · <kbd>2</kbd> отхвърли ·{" "}
        <kbd>3</kbd> пропусни · <kbd>o</kbd> отвори · <kbd>x</kbd> избери
      </p>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="overflow-x-auto rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Избери всички на страницата"
                  checked={pageAllSelected}
                  onChange={togglePage}
                />
              </th>
              <th className="px-3 py-2 font-medium">Магазин</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Категория</th>
              <th className="px-3 py-2 font-medium">Привлек.</th>
              <th className="px-3 py-2 font-medium">Цени</th>
              <th className="px-3 py-2 text-right font-medium">Увер.</th>
              <th className="px-3 py-2 font-medium">Публ.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {optimisticRows.map((shop) => {
              const { verdict, quote } = parseStatusReason(shop.status_reason);
              const focused = shop.id === focusedRow?.id;
              const expanded = shop.id === expandedId;
              const isSelected = allMatching || selected.has(shop.id);
              return (
                <Fragment key={shop.id}>
                  <tr
                    ref={(el) => {
                      if (el) rowRefs.current.set(shop.id, el);
                      else rowRefs.current.delete(shop.id);
                    }}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a, input, button")) return;
                      setFocusedId(shop.id);
                      setExpandedId(expanded ? null : shop.id);
                      containerRef.current?.focus({ preventScroll: true });
                    }}
                    className={cn(
                      "cursor-pointer align-top",
                      focused ? "bg-accent" : "hover:bg-muted/40",
                      isSelected && !focused && "bg-sky-50 dark:bg-sky-950/30"
                    )}
                  >
                    <td className={cn("px-3 py-2", focused && "shadow-[inset_3px_0_0_hsl(var(--foreground))]")}>
                      <input
                        type="checkbox"
                        aria-label={`Избери ${shop.domain}`}
                        checked={isSelected}
                        onChange={() => toggleOne(shop.id)}
                      />
                    </td>
                    <td className="max-w-md px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{shop.domain}</span>
                        {shop.voucher_url_verified ? (
                          <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-label="URL потвърден" />
                        ) : null}
                      </div>
                      {shop.name && shop.name !== shop.domain ? (
                        <div className="text-xs text-muted-foreground">{shop.name}</div>
                      ) : null}
                      {showPublishChecklist ? (
                        <PublishChecklistInline shop={shop} onPublish={() => actionsFor(shop).setPublished(true)} />
                      ) : null}
                      {!expanded && (quote || verdict) ? (
                        <p className="mt-1 line-clamp-2 text-xs" title={shop.status_reason ?? undefined}>
                          {quote ? <span className="italic">„{quote}“</span> : null}
                          {verdict ? (
                            <span className="ml-1 text-muted-foreground">— {verdict}</span>
                          ) : null}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={shop.status} />
                    </td>
                    <td className="px-3 py-2">
                      <div>{shop.category ?? "—"}</div>
                      {shop.subcategory ? (
                        <div className="text-xs text-muted-foreground">{shop.subcategory}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {shop.gift_appeal
                        ? isGiftAppeal(shop.gift_appeal)
                          ? GIFT_APPEAL_LABELS[shop.gift_appeal]
                          : shop.gift_appeal
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <PriceCell shop={shop} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatConfidence(shop.confidence)}
                    </td>
                    <td className="px-3 py-2">
                      {shop.published ? (
                        <Badge className="bg-emerald-600 text-white">Да</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <ShopDetail shop={shop} actions={actionsFor(shop)} categories={categories} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPendingBulk(null)}
        className="w-full max-w-md rounded-lg border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/40"
      >
        <h2 className="text-lg font-semibold">Потвърждение</h2>
        <p className="mt-2 text-sm">
          Да се {pendingBulk?.verb}{" "}
          <span className="font-semibold tabular-nums">{formatCount(selectionCount)}</span>{" "}
          магазина?
        </p>
        {allMatching ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Действието засяга всички резултати по текущия филтър, не само тази страница.
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => dialogRef.current?.close()}>
            Отказ
          </Button>
          <Button onClick={confirmBulk}>{pendingBulk?.label}</Button>
        </div>
      </dialog>
    </div>
  );
}
