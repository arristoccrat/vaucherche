"use client";

import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const amount = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 });

// The amount picker and the buy button: picking an amount points the button
// at the merchant page that sells it ("друга" and no pick use the shop's
// verified voucher page). Nothing is bought here.
export function BuyPanel({
  amounts,
  customAmount,
  voucherUrl,
  domain,
}: {
  amounts: { eur: number; url: string }[];
  customAmount: boolean;
  voucherUrl: string | null;
  domain: string;
}) {
  const [picked, setPicked] = useState<number | "other" | null>(amounts.length ? amounts[0].eur : null);
  const href = (typeof picked === "number" && amounts.find((a) => a.eur === picked)?.url) || voucherUrl || amounts[0]?.url || null;
  const cell =
    "flex h-[50px] items-center justify-center rounded-[13px] border-2 font-num text-[15px] font-semibold text-brand-ink";

  return (
    <div>
      {amounts.length || customAmount ? (
        <fieldset>
          <legend className="font-display text-[13px] font-bold tracking-[-0.01em] text-brand-ink lg:text-[15px]">
            Избери сума
          </legend>
          <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-3 lg:gap-2.5">
            {amounts.map((a) => (
              <button
                key={a.eur}
                type="button"
                aria-pressed={picked === a.eur}
                onClick={() => setPicked(a.eur)}
                className={cn(cell, "border-brand-ink", picked === a.eur ? "bg-brand-amber" : "bg-brand-card")}
              >
                {amount.format(a.eur)} €
              </button>
            ))}
            {customAmount ? (
              <button
                type="button"
                aria-pressed={picked === "other"}
                onClick={() => setPicked("other")}
                className={cn(
                  cell,
                  "text-[13px]",
                  picked === "other" ? "border-brand-ink bg-brand-amber" : "border-dashed border-brand-dashed bg-brand-card text-brand-quiet"
                )}
              >
                друга
              </button>
            ) : null}
          </div>
          {picked === "other" ? (
            <p className="mt-2.5 font-num text-[11.5px] font-semibold text-brand-ink">Сумата се въвежда в магазина</p>
          ) : null}
        </fieldset>
      ) : null}

      {href ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-brand-ink bg-brand-ground px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-5 lg:border-t-2 lg:border-brand-hair lg:bg-transparent lg:p-0 lg:pt-5">
          <a
            href={href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-brand-ink bg-brand-amber px-4 font-ui text-[16px] font-extrabold text-brand-ink"
          >
            Купи от {domain}
            <ArrowUpRight className="size-[18px] shrink-0" aria-hidden />
            <span className="sr-only">(отваря се в нов раздел)</span>
          </a>
        </div>
      ) : null}
    </div>
  );
}
