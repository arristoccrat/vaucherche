import { formatCount } from "@/lib/format";

type Day = { date: string; total: number; errors: number };

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

function percent(errors: number, total: number) {
  return total ? `${((errors / total) * 100).toFixed(1)}%` : "—";
}

// One series (requests per day), one axis. Errors are in the tooltip and the
// table, not a second scale. Bars: 2px gaps, 4px rounded tops on the baseline.
export function DailyFetchChart({ days }: { days: Day[] }) {
  const max = Math.max(...days.map((d) => d.total), 0);
  const total = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Заявки на обхождането по дни (UTC)</span>
        <span className="text-xs text-muted-foreground">
          Общо за {days.length} дни: {formatCount(total)}
        </span>
      </figcaption>

      <div
        role="img"
        aria-label={`Заявки по дни за последните ${days.length} дни, общо ${total}. Таблицата под графиката съдържа стойностите.`}
        className="relative"
      >
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="tabular-nums">{formatCount(max)}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex h-40 items-end gap-[2px] border-b pt-5">
          {days.map((day) => {
            const height = max ? Math.max((day.total / max) * 100, day.total ? 2 : 0) : 0;
            return (
              <div key={day.date} className="group relative flex h-full flex-1 items-end">
                {/* Hit target is the whole column, not just the bar. */}
                <div
                  className="w-full rounded-t-[4px] bg-[hsl(var(--series-1))] transition-opacity group-hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                  <div className="font-medium">{shortDate(day.date)}</div>
                  <div className="tabular-nums">Заявки: {formatCount(day.total)}</div>
                  <div className="tabular-nums text-muted-foreground">
                    Грешки: {formatCount(day.errors)} ({percent(day.errors, day.total)})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-[2px] text-[10px] text-muted-foreground">
          {days.map((day, i) => (
            <span key={day.date} className="flex-1 text-center tabular-nums">
              {i % 2 === days.length % 2 ? shortDate(day.date) : ""}
            </span>
          ))}
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground">Таблица</summary>
        <table className="mt-2 w-full text-xs">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Ден</th>
              <th className="py-1 text-right font-medium">Заявки</th>
              <th className="py-1 text-right font-medium">Грешки</th>
              <th className="py-1 text-right font-medium">Дял грешки</th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {days.map((day) => (
              <tr key={day.date}>
                <td className="py-1">{day.date}</td>
                <td className="py-1 text-right">{formatCount(day.total)}</td>
                <td className="py-1 text-right">{formatCount(day.errors)}</td>
                <td className="py-1 text-right">{percent(day.errors, day.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
