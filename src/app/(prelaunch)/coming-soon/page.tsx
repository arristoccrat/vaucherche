import type { Metadata } from "next";

import { LogoMark, Wordmark } from "@/app/(public)/_components/logo";

export const metadata: Metadata = {
  title: "vaucherche — очаквайте скоро",
  description:
    "Подаръчните ваучери на българските онлайн магазини на едно място. Очаквайте скоро.",
};

// Shown to every visitor until launch (see src/middleware.ts).
export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <LogoMark className="size-24 md:size-28" />
      <h1 className="mt-6">
        <Wordmark className="text-[40px] leading-none md:text-[56px]" />
      </h1>
      <p className="mt-4 text-lg font-semibold text-brand-ink md:text-xl">
        Подарък, който никога не е сгрешен
      </p>
      <p className="mt-3 max-w-md text-balance text-[15px] leading-relaxed text-brand-body md:text-base">
        Събираме подаръчните ваучери на българските онлайн магазини на едно място — със суми,
        срок на валидност и начин на доставка.
      </p>
      <p className="mt-8 rounded-full border-2 border-brand-ink bg-brand-mint px-5 py-2 font-num text-sm font-semibold text-brand-ink">
        Очаквайте скоро
      </p>
    </main>
  );
}
