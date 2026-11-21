import { z } from "zod";

// The copy on a category's public page (sql/018): an intro under the heading
// and questions with answers at the bottom. Shared by the admin form, the
// action that saves it and the public page; no Supabase client here.

export const MAX_INTRO = 2000;
export const MAX_FAQ = 12;

export type FaqItem = { q: string; a: string };
export type CategoryContent = { intro: string; faq: FaqItem[] };

export const EMPTY_CONTENT: CategoryContent = { intro: "", faq: [] };

const faqItemSchema = z.object({
  q: z.string().trim().min(1, { message: "Въпросът не може да е празен." }).max(200, { message: "Въпросът е до 200 знака." }),
  a: z.string().trim().min(1, { message: "Отговорът не може да е празен." }).max(1000, { message: "Отговорът е до 1000 знака." }),
});

export const categoryContentSchema = z.object({
  intro: z.string().trim().max(MAX_INTRO, { message: `Текстът е до ${MAX_INTRO} знака.` }),
  faq: z.array(faqItemSchema).max(MAX_FAQ, { message: `До ${MAX_FAQ} въпроса.` }),
});

// Whatever is stored (or nothing) as content; bad entries are dropped.
export function contentFromRow(row: { intro?: string | null; faq?: unknown } | null | undefined): CategoryContent {
  if (!row) return EMPTY_CONTENT;
  const faq = Array.isArray(row.faq)
    ? row.faq.flatMap((item) => {
        const parsed = faqItemSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  return { intro: (row.intro ?? "").trim(), faq: faq.slice(0, MAX_FAQ) };
}

// sql/018 not run yet: the columns are missing, so there is simply no copy.
export function isMissingContentColumns(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || /intro|faq/.test(error.message ?? "")));
}
