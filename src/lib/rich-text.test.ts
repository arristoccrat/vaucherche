import { describe, expect, it } from "vitest";

import { parseInline, parseRichText } from "./rich-text";

describe("parseInline", () => {
  it("reads bold and italic", () => {
    expect(parseInline("Важи **12 месеца** от *покупката*.")).toEqual([
      { text: "Важи " },
      { text: "12 месеца", bold: true },
      { text: " от " },
      { text: "покупката", italic: true },
      { text: "." },
    ]);
  });

  it("leaves lone or spaced asterisks as text", () => {
    expect(parseInline("5 * 10 = 50 и ** без край")).toEqual([{ text: "5 * 10 = 50 и ** без край" }]);
  });

  it("keeps markup-looking text as plain text", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([{ text: "<script>alert(1)</script>" }]);
  });
});

describe("parseRichText", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    const blocks = parseRichText("Първи ред\nвтори ред\n\nНов абзац");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: "p", lines: [[{ text: "Първи ред" }], [{ text: "втори ред" }]] });
  });

  it("reads bullet and numbered lists, also right after a heading line", () => {
    const blocks = parseRichText("Начин на употреба:\n1. Изберете сума\n2. Платете\n- онлайн\n• в магазина");
    expect(blocks.map((b) => b.type)).toEqual(["p", "ol", "ul"]);
    expect(blocks[1]).toEqual({ type: "ol", items: [[{ text: "Изберете сума" }], [{ text: "Платете" }]] });
    expect(blocks[2]).toMatchObject({ type: "ul", items: [[{ text: "онлайн" }], [{ text: "в магазина" }]] });
  });

  it("reads a bold line whose closing marker slipped onto the next line", () => {
    const blocks = parseRichText("**Ваучер за книжарници: 10 €, 20 €\n**\nВажи навсякъде.");
    expect(blocks).toEqual([
      {
        type: "p",
        lines: [[{ text: "Ваучер за книжарници: 10 €, 20 €", bold: true }], [{ text: "Важи навсякъде." }]],
      },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(parseRichText("  \n\n ")).toEqual([]);
    expect(parseRichText(null)).toEqual([]);
  });
});
