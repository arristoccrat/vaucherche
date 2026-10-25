import Link from "next/link";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  detail,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: React.ReactNode;
  href?: string;
  tone?: "default" | "attention";
}) {
  const body = (
    <>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
    </>
  );
  const className = cn(
    "block rounded-xl border bg-card p-4",
    tone === "attention" && "border-amber-300 dark:border-amber-800",
    href && "transition-colors hover:bg-accent"
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
