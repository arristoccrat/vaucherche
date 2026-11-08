import { z } from "zod";

import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";
import { HEX_PATTERN, MIN_CONTRAST, SLUG_PATTERN, textColorFor } from "@/lib/categories";

// What the admin form sends for a category, validated the same way for
// create and update. The text colour is never sent: it is chosen here, and
// a band colour that neither ink nor white text can read on is refused.
export const categoryInputSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, { message: "Името не може да е празно." })
      .max(40, { message: "Името е до 40 знака." }),
    path: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_PATTERN, { message: "Адресът е с малки латински букви, цифри и „-“ (до 40 знака)." }),
    bg: z.string().trim().regex(HEX_PATTERN, { message: "Цветът е във вида #RRGGBB." }),
    icon: z.string().refine((value) => CATEGORY_ICON_NAMES.includes(value), { message: "Непозната иконка." }),
  })
  .transform((input, ctx) => {
    const { on, ratio, ok } = textColorFor(input.bg);
    if (!ok) {
      ctx.addIssue({
        code: "custom",
        message: `Текстът не се чете на този цвят (${ratio.toFixed(2)}:1, трябва поне ${MIN_CONTRAST}:1). Изберете по-тъмен или по-светъл цвят.`,
      });
      return z.NEVER;
    }
    return { ...input, bg: input.bg.toUpperCase(), on };
  });

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type ParsedCategoryInput = z.output<typeof categoryInputSchema>;

// Latin URL segment suggested from a Bulgarian name (Streamlined System).
const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function suggestPath(label: string) {
  return Array.from(label.toLowerCase(), (ch) => LATIN[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

// After a URL change: the old path joins previous_paths (it will redirect);
// going back to an old path takes it off the list.
export function nextPreviousPaths(previous: readonly string[], oldPath: string, newPath: string) {
  if (oldPath === newPath) return [...previous];
  return Array.from(new Set([...previous, oldPath])).filter((p) => p !== newPath);
}
