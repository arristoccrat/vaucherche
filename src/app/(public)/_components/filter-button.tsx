"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/utils";

// A filter control is a real <button aria-pressed>; its whole job is to
// navigate to the URL the server computed. The URL is the state.
export function FilterButton({
  href,
  pressed,
  className,
  style,
  children,
}: {
  href: string;
  pressed: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => startTransition(() => router.push(href, { scroll: false }))}
      className={cn(className, pending && "opacity-60")}
      style={style}
    >
      {children}
    </button>
  );
}

export function SortSelect({
  value,
  options,
}: {
  value: string;
  options: { label: string; href: string; key: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className={cn("relative", pending && "opacity-60")}>
      <span className="sr-only">Подредба</span>
      <select
        value={value}
        onChange={(event) => {
          const option = options.find((o) => o.key === event.target.value);
          if (option) startTransition(() => router.push(option.href, { scroll: false }));
        }}
        className="h-11 cursor-pointer appearance-none rounded-full border-2 border-brand-ink bg-brand-card pl-4 pr-9 font-ui text-sm font-bold text-brand-ink"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-ink">
        ▾
      </span>
    </label>
  );
}
