import { CONTACT_EMAIL } from "@/lib/site";

import { LogoMark, Wordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-brand-ink bg-brand-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <Wordmark className="text-lg" />
          </div>
          <p className="max-w-xl text-sm text-brand-body">
            Каталог на подаръчни ваучери от български онлайн магазини. Не продаваме ваучери и не
            приемаме плащания — пращаме те директно на магазина.
          </p>
        </div>
        {CONTACT_EMAIL ? (
          <p className="text-sm text-brand-body">
            Контакт:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-brand-mint-deep underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        ) : null}
      </div>
    </footer>
  );
}
