import { describe, expect, it } from "vitest";

import { fromDoc, toDoc, type DocNode } from "./rich-text-doc";

const text = (t: string, mark?: "bold" | "italic"): DocNode =>
  mark ? { type: "text", text: t, marks: [{ type: mark }] } : { type: "text", text: t };

describe("visual editor document", () => {
  it("round-trips paragraphs, line breaks, bold, italic and lists", () => {
    const source = "Важи **12 месеца** от *покупката*.\nВтори ред\n\n- онлайн\n- в магазина\n\n1. Изберете сума\n2. Платете";
    expect(fromDoc(toDoc(source))).toBe(source);
  });

  it("keeps spaces outside the markers", () => {
    const doc: DocNode = { type: "doc", content: [{ type: "paragraph", content: [text("Важи "), text("само онлайн ", "bold"), text("и "), text(" днес", "italic")] }] };
    expect(fromDoc(doc)).toBe("Важи **само онлайн** и  *днес*");
  });

  it("drops empty paragraphs and flattens nested lists", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "paragraph" },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [text("едно")] },
                { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [text("вложено")] }] }] },
              ],
            },
          ],
        },
        { type: "paragraph" },
      ],
    };
    expect(fromDoc(doc)).toBe("- едно вложено");
  });

  it("repairs a bold run broken across lines when it is saved again", () => {
    expect(fromDoc(toDoc("**Ваучер: 10 €\n**\nВажи навсякъде."))).toBe("**Ваучер: 10 €**\nВажи навсякъде.");
  });

  it("gives the editor an empty paragraph for empty text", () => {
    expect(toDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(fromDoc(toDoc(""))).toBe("");
  });
});
