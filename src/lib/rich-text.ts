// A small text format for the voucher description, written in the admin and
// shown on the shop page. It is parsed into plain data and rendered as React
// elements, never as HTML, so nothing typed into it can become markup.
//
//   **bold**   *italic*
//   - item     (a run of lines starting "- ", "• " or "* ")
//   1. item    (a run of lines starting "1. " or "1) ")
//   a blank line starts a new paragraph; other line breaks are kept.

export type Span = { text: string; bold?: boolean; italic?: boolean };
export type Line = Span[];
export type Block =
  | { type: "p"; lines: Line[] }
  | { type: "ul"; items: Line[] }
  | { type: "ol"; items: Line[] };

const BULLET = /^\s*[-•*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const INLINE = /(\*\*[^*\n]+?\*\*|\*[^*\s][^*\n]*?\*)/g;

export function parseInline(text: string): Line {
  const spans: Line = [];
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else {
      spans.push({ text: part });
    }
  }
  return spans;
}

export function parseRichText(source: string | null | undefined): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  const close = () => {
    if (current) blocks.push(current);
    current = null;
  };

  // A bold or italic run whose closing marker slipped onto the next line on
  // its own ("**Заглавие\n**", from selecting a whole line with its break)
  // is read as if the marker sat at the end of the line.
  const text = (source ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/(\*\*?)([^*\s][^*\n]*?)[ \t]*\n[ \t]*\1[ \t]*(?=\n|$)/g, "$1$2$1");

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      close();
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const type = bullet ? "ul" : numbered ? "ol" : "p";
    const content = parseInline((bullet?.[1] ?? numbered?.[1] ?? line).trim());

    const open = current as Block | null;
    if (!open || open.type !== type) {
      close();
      current = type === "p" ? { type, lines: [content] } : { type, items: [content] };
    } else if (open.type === "p") {
      open.lines.push(content);
    } else {
      open.items.push(content);
    }
  }
  close();
  return blocks;
}
