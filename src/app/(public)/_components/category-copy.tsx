import { ChevronDown } from "lucide-react";

import { RichText } from "@/components/rich-text";
import type { FaqItem } from "@/lib/category-content";

import { FaqJsonLd } from "./json-ld";

// The intro under a category page's heading: the editor's text (rich-text
// format, rendered as React elements), or a line written from the facts.
export function CategoryIntro({ text, fallback }: { text: string; fallback: string }) {
  return (
    <div className="mt-3 max-w-[72ch] text-[14.5px] leading-relaxed text-brand-body [&_p+p]:mt-2">
      {text ? <RichText source={text} /> : <p>{fallback}</p>}
    </div>
  );
}

// Questions and answers at the bottom of a category page, with the same
// content as FAQPage data for search engines.
export function CategoryFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="mt-12 max-w-[80ch]">
      <FaqJsonLd items={items} />
      <h2 id="faq-heading" className="font-display text-[20px] font-extrabold tracking-[-0.01em] text-brand-ink">
        Често задавани въпроси
      </h2>
      <div className="mt-4 divide-y-2 divide-brand-hair rounded-[18px] border-2 border-brand-ink bg-brand-card">
        {items.map((item) => (
          <details key={item.q} className="group px-5">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-3 font-ui text-[15px] font-bold text-brand-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown aria-hidden className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-4 text-[14.5px] leading-relaxed text-brand-body [&_p+p]:mt-2">
              <RichText source={item.a} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
