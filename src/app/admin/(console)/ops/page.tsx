import Link from "next/link";

import { QueryError } from "@/components/query-error";
import { SourceBadge } from "@/app/admin/(console)/shops/_components/price-cell";
import { PRODUCT_SOURCES, SHOP_STATUSES, STATUS_LABELS } from "@/lib/domain";
import { formatCount } from "@/lib/format";
import { getOpsStats } from "@/lib/queries/ops";
import { getStatusCounts } from "@/lib/queries/shops";

import { DailyFetchChart } from "./_components/daily-fetch-chart";
import { StatTile } from "./_components/stat-tile";

const SOURCE_NOTES: Record<string, string> = {
  og: "Open Graph — надеждно",
  jsonld: "JSON-LD — надеждно",
  text: "от видимия текст — за проверка",
  manual: "ръчно добавен URL — чака цена",
};

function relativeTime(iso: string | null, now: Date) {
  if (!iso) return "никога";
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "току-що";
  if (minutes < 60) return `преди ${minutes} мин`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `преди ${hours} ч`;
  return `преди ${Math.round(hours / 24)} дни`;
}

function share(part: number, whole: number) {
  return whole ? `${((part / whole) * 100).toFixed(1)}%` : "—";
}

export default async function OpsPage() {
  const [stats, counts] = await Promise.all([getOpsStats(), getStatusCounts()]);
  if ("error" in stats) return <QueryError message={stats.error} />;

  const now = new Date(stats.generatedAt);
  const confirmedTotal = stats.confirmed + stats.aiConfirmed;
  const maxStatus = counts ? Math.max(...Object.values(counts.byStatus), 1) : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Операции</h1>
        <span className="text-xs text-muted-foreground">
          Данни към {now.toLocaleTimeString("bg-BG")} · опресняват се на всяка минута
        </span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Публикувани"
          value={formatCount(stats.published)}
          detail={`от ${formatCount(confirmedTotal)} потвърдени (${share(stats.published, confirmedTotal)})`}
          href="/admin/shops?published=yes"
        />
        <StatTile
          label="Потвърдени · Потвърдени от AI"
          value={`${formatCount(stats.confirmed)} · ${formatCount(stats.aiConfirmed)}`}
          detail="Доказателства или човек · машинна преценка"
          href="/admin/queue"
        />
        <StatTile
          label="Потвърдени без продукти"
          value={formatCount(stats.noProducts)}
          detail="Опашка за обхождане на продукти"
          tone={stats.noProducts ? "attention" : "default"}
        />
        <StatTile
          label="Публикувани без цена"
          value={formatCount(stats.publishedNoPrice)}
          detail="Обявите ще изглеждат бедни"
          tone={stats.publishedNoPrice ? "attention" : "default"}
        />
        <StatTile
          label="Последно обхождане"
          value={relativeTime(stats.lastFetch, now)}
          detail={stats.lastFetch ? new Date(stats.lastFetch).toLocaleString("bg-BG") : "Няма записи във fetch_log"}
        />
        <StatTile
          label="Заявки за 24 ч"
          value={formatCount(stats.fetches24h)}
          detail={`Грешки: ${formatCount(stats.errors24h)} (${share(stats.errors24h, stats.fetches24h)})`}
          tone={stats.fetches24h && stats.errors24h / stats.fetches24h > 0.2 ? "attention" : "default"}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium">
            Статуси{counts ? ` · ${formatCount(counts.total)} магазина` : ""}
          </h2>
          {counts ? (
            <ul className="space-y-2">
              {SHOP_STATUSES.map((status) => {
                const value = counts.byStatus[status];
                return (
                  <li key={status}>
                    <Link
                      href={`/admin/shops?status=${status}`}
                      className="group grid grid-cols-[9rem_1fr_4.5rem] items-center gap-3 text-sm"
                    >
                      <span className="group-hover:underline">{STATUS_LABELS[status]}</span>
                      <span className="h-3 rounded-r-[4px] bg-[hsl(var(--series-1))]" style={{ width: `${(value / maxStatus) * 100}%` }} />
                      <span className="text-right tabular-nums">{formatCount(value)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Броят по статус не е наличен.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">
            Продукти по източник на цената · {formatCount(stats.productTotal)}
          </h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {PRODUCT_SOURCES.map((source) => (
                <tr key={source}>
                  <td className="py-2">
                    <SourceBadge source={source} />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{SOURCE_NOTES[source]}</td>
                  <td className="py-2 text-right tabular-nums">{formatCount(stats.bySource[source])}</td>
                  <td className="w-16 py-2 text-right text-xs tabular-nums text-muted-foreground">
                    {share(stats.bySource[source], stats.productTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-xl border p-4">
        <DailyFetchChart days={stats.daily} />
      </section>
    </div>
  );
}
