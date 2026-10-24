import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, isShopStatus, type ShopStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

// confirmed and ai_confirmed get clearly different colours: one has evidence
// or a human behind it, the other is a machine verdict.
export const STATUS_STYLES: Record<ShopStatus, string> = {
  confirmed:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ai_confirmed:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
  needs_review:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  unreachable:
    "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  candidate:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
};

export function StatusBadge({ status }: { status: string }) {
  if (!isShopStatus(status)) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
