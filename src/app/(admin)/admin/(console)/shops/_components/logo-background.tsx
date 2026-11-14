"use client";

import { updateShopEditorial } from "@/actions/editorial";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { FieldLabel, useAutosave } from "./autosave";

// One-click backgrounds; "" is white (no colour stored).
const PRESETS = [
  { value: "", label: "Бяло", swatch: BRAND.card },
  { value: BRAND.ground.toLowerCase(), label: "Крем", swatch: BRAND.ground },
  { value: BRAND.ink.toLowerCase(), label: "Тъмно", swatch: BRAND.ink },
  { value: "#000000", label: "Черно", swatch: "#000000" },
] as const;

// The colour behind the logo on the public cards and the shop page
// (shops.logo_bg, sql/016). For white or pale logos that vanish on white.
// Presets save at once; the colour picker saves when it loses focus.
export function LogoBackground({
  shopId,
  logoUrl,
  initial,
}: {
  shopId: string;
  logoUrl: string | null;
  initial: string | null;
}) {
  const bg = useAutosave(
    (value) => updateShopEditorial(shopId, { logo_bg: value }),
    initial ?? ""
  );
  const id = `logo_bg-${shopId}`;
  const shown = bg.value || BRAND.card;

  return (
    <div className="space-y-2">
      <FieldLabel
        htmlFor={id}
        label="Фон зад логото"
        hint="ако логото е бяло или бледо"
        state={bg.state}
      />
      <div className="flex items-center gap-3">
        <div
          className="relative flex aspect-[1.6] w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-neutral-900"
          style={{ backgroundColor: shown }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of our own storage copy
            <img
              src={logoUrl}
              alt=""
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <span className="text-xs text-neutral-500">без лого</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => bg.change(p.value, true)}
              aria-pressed={bg.value === p.value}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs",
                bg.value === p.value
                  ? "border-neutral-900 bg-neutral-100 font-semibold"
                  : "border-neutral-300 hover:bg-neutral-50"
              )}
            >
              <span
                aria-hidden
                className="size-3.5 rounded-sm border border-neutral-400"
                style={{ backgroundColor: p.swatch }}
              />
              {p.label}
            </button>
          ))}
          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-300 px-2 text-xs hover:bg-neutral-50">
            <input
              id={id}
              type="color"
              value={shown}
              onChange={(event) => bg.change(event.target.value)}
              onBlur={bg.flush}
              className="size-4 cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="font-mono">{bg.value || "друг цвят"}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
