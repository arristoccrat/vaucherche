"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { NOT_SIGNED_IN, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import type { ShopStatus } from "@/lib/domain";
import { canPublish, publishChecks } from "@/lib/publish";
import {
  MAX_BULK_ROWS,
  SHOP_COUNTS_TAG,
  resolveShopTargets,
  type ShopTarget,
} from "@/lib/queries/shops";
import { parseShopFilters } from "@/lib/search-params";
import { createAdminClient } from "@/lib/supabase/admin";

// PostgREST puts `in.(…)` filters in the URL; 200 uuids keeps it well under
// the length limit.
const CHUNK = 200;

// A human can set any status except ai_confirmed, which is by definition a
// machine verdict.
const HUMAN_STATUSES = [
  "candidate",
  "confirmed",
  "needs_review",
  "rejected",
  "unreachable",
] as const satisfies readonly ShopStatus[];

const humanStatus = z.enum(HUMAN_STATUSES);
const shopId = z.guid();

const bulkTarget = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ids"),
    ids: z.array(shopId).min(1).max(MAX_BULK_ROWS),
  }),
  // "Select all matching this filter": the shops page query string.
  z.object({ kind: z.literal("filter"), query: z.string().max(2000) }),
]);
export type BulkTarget = z.infer<typeof bulkTarget>;

type Counted = { updated: number; skipped: number };

const HUMAN_REASON: Partial<Record<ShopStatus, string>> = {
  confirmed: "потвърден от човек",
  rejected: "отхвърлен от човек",
};

function chunks<T>(items: T[], size = CHUNK) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function invalid(): ActionResult<never> {
  return { ok: false, error: "Невалидни данни." };
}

function failed(error: unknown): ActionResult<never> {
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: `Грешка при запис: ${message}` };
}

function refresh() {
  revalidatePath("/admin/shops");
  revalidatePath("/admin/queue");
  revalidateTag(SHOP_COUNTS_TAG);
}

async function applyStatus(ids: string[], status: ShopStatus) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const reason = HUMAN_REASON[status];
  let updated = 0;

  for (const chunk of chunks(ids)) {
    const { data, error } = await supabase
      .from("shops")
      .update({
        status,
        updated_at: now,
        ...(reason ? { status_reason: reason } : {}),
      })
      .in("id", chunk)
      .select("id");
    if (error) throw new Error(error.message);
    updated += data.length;

    // Record the human verdict on the offer so it stays distinguishable from
    // the machine one.
    if (status === "confirmed" || status === "rejected") {
      const { error: offerError } = await supabase
        .from("voucher_offers")
        .update({ verified_by_human: status === "confirmed", verified_at: now })
        .in("shop_id", chunk);
      if (offerError) throw new Error(offerError.message);
    }
  }

  return updated;
}

async function loadTargets(ids: string[]) {
  const supabase = createAdminClient();
  const rows: ShopTarget[] = [];
  for (const chunk of chunks(ids)) {
    const { data, error } = await supabase
      .from("shops")
      .select("id, status, status_reason")
      .in("id", chunk);
    if (error) throw new Error(error.message);
    rows.push(...data);
  }
  return rows;
}

async function resolveTarget(
  target: BulkTarget
): Promise<ShopTarget[] | { error: string }> {
  if (target.kind === "ids") return loadTargets(target.ids);

  const filters = parseShopFilters(
    Object.fromEntries(new URLSearchParams(target.query))
  );
  const result = await resolveShopTargets(filters);
  if ("tooMany" in result) {
    return {
      error: `Филтърът съвпада с ${result.tooMany} магазина — над лимита от ${MAX_BULK_ROWS} за едно действие. Стеснете филтъра.`,
    };
  }
  return result;
}

function aiRejected(target: ShopTarget) {
  return (target.status_reason ?? "").trim().toLowerCase().startsWith("ai rejected");
}

export async function setStatus(
  id: string,
  status: ShopStatus
): Promise<ActionResult<Counted>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ id: shopId, status: humanStatus }).safeParse({ id, status });
  if (!parsed.success) return invalid();

  try {
    const updated = await applyStatus([parsed.data.id], parsed.data.status);
    refresh();
    return { ok: true, data: { updated, skipped: 0 } };
  } catch (error) {
    return failed(error);
  }
}

export async function bulkSetStatus(
  target: BulkTarget,
  status: ShopStatus
): Promise<ActionResult<Counted>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z
    .object({ target: bulkTarget, status: humanStatus })
    .safeParse({ target, status });
  if (!parsed.success) return invalid();

  try {
    const targets = await resolveTarget(parsed.data.target);
    if ("error" in targets) return { ok: false, error: targets.error };
    if (!targets.length) return { ok: true, data: { updated: 0, skipped: 0 } };

    // The model actively judged these not to be vouchers. Never let them
    // slip into "confirmed" through a bulk action.
    if (parsed.data.status === "confirmed") {
      const blocked = targets.filter(aiRejected);
      if (blocked.length) {
        return {
          ok: false,
          error: `${blocked.length} от избраните магазини са отхвърлени от AI („AI rejected“). Масовото потвърждаване е блокирано — махнете ги от избора и ги потвърдете поотделно.`,
        };
      }
    }

    const updated = await applyStatus(
      targets.map((t) => t.id),
      parsed.data.status
    );
    refresh();
    return { ok: true, data: { updated, skipped: 0 } };
  } catch (error) {
    return failed(error);
  }
}

async function applyPublished(ids: string[], published: boolean): Promise<Counted> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let updated = 0;
  let skipped = 0;

  for (const chunk of chunks(ids)) {
    let eligible = chunk;
    if (published) {
      // Re-check the publish gate on the server, row by row.
      const { data, error } = await supabase
        .from("shops")
        .select("id, status, domain, name, description, category, voucher_url, voucher_url_verified")
        .in("id", chunk);
      if (error) throw new Error(error.message);
      eligible = data.filter(canPublish).map((shop) => shop.id);
      skipped += chunk.length - eligible.length;
      if (!eligible.length) continue;
    }

    const { data, error } = await supabase
      .from("shops")
      .update({ published, updated_at: now })
      .in("id", eligible)
      .select("id");
    if (error) throw new Error(error.message);
    updated += data.length;
  }

  return { updated, skipped };
}

export async function setPublished(
  id: string,
  published: boolean
): Promise<ActionResult<Counted>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z.object({ id: shopId, published: z.boolean() }).safeParse({ id, published });
  if (!parsed.success) return invalid();

  try {
    if (parsed.data.published) {
      const supabase = createAdminClient();
      const { data: shop, error } = await supabase
        .from("shops")
        .select("status, domain, name, description, category, voucher_url, voucher_url_verified")
        .eq("id", parsed.data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!shop) return { ok: false, error: "Магазинът не е намерен." };
      const missing = publishChecks(shop).filter((check) => !check.ok);
      if (missing.length) {
        return {
          ok: false,
          error: `Не може да се публикува: ${missing.map((c) => c.label).join("; ")}.`,
        };
      }
    }

    const result = await applyPublished([parsed.data.id], parsed.data.published);
    refresh();
    return { ok: true, data: result };
  } catch (error) {
    return failed(error);
  }
}

export async function bulkSetPublished(
  target: BulkTarget,
  published: boolean
): Promise<ActionResult<Counted>> {
  if (!(await getUser())) return NOT_SIGNED_IN;
  const parsed = z
    .object({ target: bulkTarget, published: z.boolean() })
    .safeParse({ target, published });
  if (!parsed.success) return invalid();

  try {
    const targets = await resolveTarget(parsed.data.target);
    if ("error" in targets) return { ok: false, error: targets.error };
    const result = await applyPublished(
      targets.map((t) => t.id),
      parsed.data.published
    );
    refresh();
    return { ok: true, data: result };
  } catch (error) {
    return failed(error);
  }
}
