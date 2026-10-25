import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

import { countPublishedShops } from "../_lib/browse";
import { AMOUNT_BUCKETS, DEFAULT_FILTERS, browseHref, shopCountLabel, type BrowseFilters } from "../_lib/browse-params";

const ctaClass =
  "inline-flex h-11 items-center rounded-full border-2 border-brand-ink px-5 font-ui text-sm font-extrabold text-brand-ink";

// Nothing matched: name the one filter whose removal brings back the most
// shops, and offer to drop it or everything.
export async function BrowseEmpty({ filters }: { filters: BrowseFilters }) {
  const candidates: { label: string; changes: Partial<BrowseFilters> }[] = [];
  if (filters.kategoriya) candidates.push({ label: `„${CATEGORIES[filters.kategoriya].label}“`, changes: { kategoriya: null } });
  if (filters.suma) {
    const bucket = AMOUNT_BUCKETS.find((b) => b.key === filters.suma);
    candidates.push({ label: `сума ${bucket?.label ?? ""}`.trim(), changes: { suma: null } });
  }
  if (filters.dostavka.length) candidates.push({ label: "доставка", changes: { dostavka: [] } });

  const counted = await Promise.all(
    candidates.map(async (c) => ({ ...c, count: await countPublishedShops({ ...filters, ...c.changes }) }))
  );
  const best = counted.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="rounded-[18px] border-2 border-dashed border-brand-dashed bg-brand-card px-6 py-10 text-center">
      <h2 className="font-display text-[19px] font-bold tracking-[-0.01em] text-brand-ink">Няма магазини с тези филтри</h2>
      {best ? (
        <p className="mt-2 text-[14px] text-brand-body">
          Без {best.label} има <span className="font-num font-semibold text-brand-ink">{shopCountLabel(best.count)}</span>.
        </p>
      ) : (
        <p className="mt-2 text-[14px] text-brand-body">Опитайте с по-малко филтри.</p>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {best ? (
          <Link href={browseHref(filters, best.changes)} className={`${ctaClass} bg-brand-amber`}>
            Махни {best.label}
          </Link>
        ) : null}
        <Link href={browseHref(DEFAULT_FILTERS, { podredba: filters.podredba })} className={`${ctaClass} bg-brand-card`}>
          Изчисти филтрите
        </Link>
      </div>
    </div>
  );
}
