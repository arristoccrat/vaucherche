import Link from "next/link";

import { countPublishedShops } from "../_lib/browse";
import { AMOUNT_BUCKETS, DEFAULT_FILTERS, browseHref, shopCountLabel, type BrowseFilters } from "../_lib/browse-params";

const ctaClass =
  "inline-flex h-11 items-center rounded-full border-2 border-brand-ink px-5 font-ui text-sm font-extrabold text-brand-ink";

// Nothing matched: name the one filter whose removal brings back the most
// shops, and offer to drop it or everything.
export async function BrowseEmpty({ filters }: { filters: BrowseFilters }) {
  const candidates: { label: string; changes: Partial<BrowseFilters> }[] = [];
  if (filters.kategorii.length) {
    candidates.push({
      label: filters.kategorii.length === 1 ? `„${filters.kategorii[0].label}“` : "категориите",
      changes: { kategorii: [] },
    });
  }
  if (filters.suma.length) {
    const only = filters.suma.length === 1 ? AMOUNT_BUCKETS.find((b) => b.key === filters.suma[0]) : null;
    candidates.push({ label: only ? `сума ${only.label.toLowerCase()}` : "сумите", changes: { suma: [] } });
  }
  if (filters.dostavka.length) candidates.push({ label: "получаване", changes: { dostavka: [] } });
  if (filters.grad.length) candidates.push({ label: filters.grad.length === 1 ? "града" : "градовете", changes: { grad: [] } });

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
