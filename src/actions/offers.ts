"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import type { TablesUpdate } from "@/lib/database.types";
import { toEur } from "@/lib/format";
import { OFFER_FIELDS, type OfferField } from "@/lib/offer-fields";
import { parseEuro, parseEuroList } from "@/lib/parse-amounts";
import { createAdminClient } from "@/lib/supabase/admin";

// Human corrections to the AI-extracted voucher facts. One field per call
// (autosave). Every save stamps human_edited_at, which tells the pipeline not
// to overwrite this row.


const MONEY_FIELDS: OfferField[] = ["denominations", "min_value", "max_value"];
const BOOL_FIELDS: OfferField[] = ["custom_amount", "is_digital", "is_physical", "personalisable"];

type OfferPatch = TablesUpdate<"voucher_offers">;

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

function parseField(field: OfferField, raw: string): OfferPatch | string {
  const value = raw.trim();
  if (BOOL_FIELDS.includes(field)) {
    if (value !== "yes" && value !== "no" && value !== "") return "Невалидна стойност.";
    return { [field]: value === "" ? null : value === "yes" };
  }
  switch (field) {
    case "denominations": {
      const list = parseEuroList(value);
      if (list === null) return "Номиналите са суми в евро, разделени с интервал: 25 50 100.";
      if (list.length > 30) return "Най-много 30 номинала.";
      return { denominations: list.length ? list : null };
    }
    case "min_value":
    case "max_value": {
      const amount = parseEuro(value);
      if (amount === "invalid") return "Въведете една сума в евро, напр. 25 или 12,50.";
      return { [field]: amount };
    }
    case "delivery_methods": {
      const list = value
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 10 || list.some((s) => s.length > 60)) return "Твърде дълъг списък.";
      return { delivery_methods: list.length ? list : null };
    }
    case "validity_months": {
      if (value === "") return { validity_months: null };
      const months = Number(value);
      if (!Number.isInteger(months) || months < 1 || months > 120) return "Валидност в месеци: от 1 до 120.";
      return { validity_months: months };
    }
    case "terms_url": {
      if (value === "") return { terms_url: null };
      try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
      } catch {
        return "Невалиден URL.";
      }
      return { terms_url: value };
    }
  }
  return "Непознато поле.";
}

export async function updateOfferFact(
  shopId: string,
  offerId: string | null,
  field: OfferField,
  value: string
): Promise<ActionResult<{ offerId: string }>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const input = z
    .object({
      shopId: z.guid(),
      offerId: z.guid().nullable(),
      field: z.enum(OFFER_FIELDS),
      value: z.string().max(2000),
    })
    .safeParse({ shopId, offerId, field, value });
  if (!input.success) return fail("Невалидни данни.");

  const parsed = parseField(input.data.field, input.data.value);
  if (typeof parsed === "string") return fail(parsed);

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let patch: OfferPatch = { ...parsed, human_edited_at: now };

  let current: { id: string; currency: string | null; denominations: number[] | null; min_value: number | null; max_value: number | null } | null = null;
  if (input.data.offerId) {
    const { data, error } = await supabase
      .from("voucher_offers")
      .select("id, currency, denominations, min_value, max_value")
      .eq("id", input.data.offerId)
      .eq("shop_id", input.data.shopId)
      .maybeSingle();
    if (error) return fail(`Грешка при четене: ${error.message}`);
    if (!data) return fail("Офертата не е намерена.");
    current = data;
  }

  // Money is entered in euros. Keep the row in one currency: convert the
  // money fields not being edited from their stored currency to EUR as well.
  if (MONEY_FIELDS.includes(input.data.field)) {
    const convert = (v: number | null) => {
      const eur = toEur(v, current?.currency ?? "BGN");
      return eur == null ? null : Math.round(eur * 100) / 100;
    };
    const existing: OfferPatch = current
      ? {
          denominations: current.denominations
            ? current.denominations.map((d) => convert(d)).filter((d): d is number => d != null)
            : null,
          min_value: convert(current.min_value),
          max_value: convert(current.max_value),
        }
      : {};
    patch = { ...existing, ...patch, currency: "EUR" };
  }

  let savedId = current?.id ?? null;
  if (savedId) {
    const { error } = await supabase.from("voucher_offers").update(patch).eq("id", savedId);
    if (error) return fail(`Грешка при запис: ${error.message}`);
  } else {
    // No extracted offer yet: start one from the human's input.
    const { data, error } = await supabase
      .from("voucher_offers")
      .insert({ shop_id: input.data.shopId, currency: "EUR", ...patch })
      .select("id")
      .single();
    if (error) return fail(`Грешка при запис: ${error.message}`);
    savedId = data.id;
  }

  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
  return { ok: true, data: { offerId: savedId } };
}
