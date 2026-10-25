export function ComingSoon() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
      />

      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Очаквайте скоро
      </span>

      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
        Vaucherche<span className="text-emerald-500">.bg</span>
      </h1>

      <p className="mt-6 max-w-xl text-balance text-lg sm:text-xl">
        Подаръчни ваучери от магазините в България — на едно място. Сравнете
        стойности, валидност и начин на доставка и намерете идеалния подарък.
      </p>

      <ul className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {[
          { icon: "🎁", title: "Подаръчни ваучери", text: "От любимите магазини в България" },
          { icon: "⚖️", title: "Лесно сравнение", text: "Стойности, валидност и доставка" },
          { icon: "✉️", title: "Дигитални и физически", text: "Изпратени по имейл или по пощата" },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border p-5"
          >
            <div className="text-2xl" aria-hidden>
              {item.icon}
            </div>
            <h2 className="mt-2 font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm">{item.text}</p>
          </li>
        ))}
      </ul>

      <footer className="mt-16 text-sm">
        © {new Date().getFullYear()} Vaucherche.bg
      </footer>
    </main>
  );
}
