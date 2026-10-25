// Placeholders shown while a page streams in (loading.tsx). Shapes match
// the real layout so nothing jumps when the content arrives.

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-brand-hair bg-brand-card">
      <div className="h-[110px] bg-brand-hair/60 md:h-[132px]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-brand-hair/80" />
        <div className="h-3 w-full rounded bg-brand-hair/60" />
        <div className="h-3 w-4/5 rounded bg-brand-hair/60" />
        <div className="flex gap-1.5">
          <div className="h-7 w-14 rounded-[12px] bg-brand-hair/80" />
          <div className="h-7 w-11 rounded-[12px] bg-brand-hair/60" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ withRail = false }: { withRail?: boolean }) {
  return (
    <div className="mx-auto flex max-w-[1440px] animate-pulse" aria-busy="true" aria-label="Зарежда се">
      {withRail ? <div className="hidden w-[272px] shrink-0 border-r-2 border-brand-hair lg:block" /> : null}
      <div className="min-w-0 flex-1 px-4 pb-10 pt-4 lg:px-9 lg:pt-[26px]">
        <div className="h-8 w-64 max-w-full rounded bg-brand-hair/80 lg:h-9" />
        <div className="mt-2 h-3 w-48 rounded bg-brand-hair/60" />
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-[18px] xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] animate-pulse px-4 pt-3 lg:px-10 lg:pt-6" aria-busy="true" aria-label="Зарежда се">
      <div className="h-11 w-56 rounded bg-brand-hair/60" />
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_376px] lg:gap-8">
        <div>
          <div className="h-[170px] rounded-[22px] bg-brand-hair/60 lg:h-[292px]" />
          <div className="mt-5 h-7 w-1/2 rounded bg-brand-hair/80" />
          <div className="mt-4 h-3 w-full rounded bg-brand-hair/60" />
          <div className="mt-2 h-3 w-3/4 rounded bg-brand-hair/60" />
        </div>
        <div className="mt-6 h-[260px] rounded-[22px] bg-brand-hair/60 lg:mt-0" />
      </div>
    </div>
  );
}
