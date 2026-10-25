"use client";

import { useRef } from "react";

import { updateOfferFact } from "@/actions/offers";
import { toEur } from "@/lib/format";
import type { OfferField } from "@/lib/offer-fields";
import type { ShopListRow } from "@/lib/queries/shops";

import { FieldLabel, fieldClass, useAutosave } from "./autosave";

type Offer = ShopListRow["voucher_offers"][number] | undefined;

const euro = (value: number | null | undefined, currency: string | null | undefined) => {
  const eur = toEur(value ?? null, currency ?? null);
  return eur == null ? "" : String(Math.round(eur * 100) / 100).replace(".", ",");
};
const yesNo = (value: boolean | null | undefined) => (value == null ? "" : value ? "yes" : "no");

function useOfferField(shopId: string, offerId: { current: string | null }, field: OfferField, initial: string) {
  return useAutosave(async (value) => {
    const result = await updateOfferFact(shopId, offerId.current, field, value);
    if (result?.ok) offerId.current = result.data.offerId;
    return result;
  }, initial);
}

function TextFact({
  id,
  label,
  hint,
  placeholder,
  field,
  inputMode,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  field: ReturnType<typeof useAutosave>;
  inputMode?: "decimal" | "numeric" | "url";
}) {
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} hint={hint} state={field.state} />
      <input
        id={id}
        value={field.value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => field.change(event.target.value)}
        onBlur={field.flush}
        className={fieldClass}
      />
    </div>
  );
}

function BoolFact({ id, label, field }: { id: string; label: string; field: ReturnType<typeof useAutosave> }) {
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} state={field.state} />
      <select id={id} value={field.value} onChange={(event) => field.change(event.target.value, true)} className={fieldClass}>
        <option value="">—</option>
        <option value="yes">Да</option>
        <option value="no">Не</option>
      </select>
    </div>
  );
}

// The AI-extracted voucher facts, editable. Amounts are entered in euros.
// A correction marks the offer as human-edited so the pipeline leaves it be.
export function OfferFactsForm({ shopId, offer }: { shopId: string; offer: Offer }) {
  const offerId = useRef<string | null>(offer?.id ?? null);
  const id = (name: string) => `${name}-${shopId}`;
  const currency = offer?.currency;

  const denominations = useOfferField(
    shopId,
    offerId,
    "denominations",
    (offer?.denominations ?? []).map((d) => euro(d, currency)).filter(Boolean).join(" ")
  );
  const minValue = useOfferField(shopId, offerId, "min_value", euro(offer?.min_value, currency));
  const maxValue = useOfferField(shopId, offerId, "max_value", euro(offer?.max_value, currency));
  const customAmount = useOfferField(shopId, offerId, "custom_amount", yesNo(offer?.custom_amount));
  const digital = useOfferField(shopId, offerId, "is_digital", yesNo(offer?.is_digital));
  const physical = useOfferField(shopId, offerId, "is_physical", yesNo(offer?.is_physical));
  const personalisable = useOfferField(shopId, offerId, "personalisable", yesNo(offer?.personalisable));
  const delivery = useOfferField(shopId, offerId, "delivery_methods", (offer?.delivery_methods ?? []).join(", "));
  const validity = useOfferField(shopId, offerId, "validity_months", offer?.validity_months ? String(offer.validity_months) : "");
  const terms = useOfferField(shopId, offerId, "terms_url", offer?.terms_url ?? "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold">Факти за ваучера</h3>
        <span className="text-xs text-muted-foreground">
          {offer?.human_edited_at
            ? `Коригирани от човек ${new Date(offer.human_edited_at).toLocaleDateString("bg-BG")} · обхождането не ги презаписва`
            : offer
              ? "Извлечени от AI · поправете, ако е нужно"
              : "Няма извлечени данни · попълнете ръчно"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TextFact id={id("denominations")} label="Номинали" hint="€, с интервал" placeholder="25 50 100" field={denominations} inputMode="decimal" />
        <TextFact id={id("min_value")} label="Минимум" hint="€" placeholder="10" field={minValue} inputMode="decimal" />
        <TextFact id={id("max_value")} label="Максимум" hint="€" placeholder="500" field={maxValue} inputMode="decimal" />
        <BoolFact id={id("custom_amount")} label="Свободна сума" field={customAmount} />
        <BoolFact id={id("is_digital")} label="Дигитален" field={digital} />
        <BoolFact id={id("is_physical")} label="Физически" field={physical} />
        <BoolFact id={id("personalisable")} label="Персонализиране" field={personalisable} />
        <TextFact id={id("delivery_methods")} label="Доставка" hint="със запетая" placeholder="имейл, куриер" field={delivery} />
        <TextFact id={id("validity_months")} label="Валидност" hint="месеци" placeholder="12" field={validity} inputMode="numeric" />
        <div className="sm:col-span-2 lg:col-span-3">
          <TextFact id={id("terms_url")} label="Условия (URL)" placeholder="https://…" field={terms} inputMode="url" />
        </div>
      </div>
    </div>
  );
}
