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

  for (const raw of (source ?? "").replace(/\r\n?/g, "\n").split("\n")) {
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

// Admin toolbar helpers: change the text around the selection and say where
// the selection should be afterwards.
export type Edit = { value: string; start: number; end: number };

export function toggleWrap(value: string, start: number, end: number, marker: "**" | "*"): Edit {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return {
      value: before.slice(0, -marker.length) + selected + after.slice(marker.length),
      start: start - marker.length,
      end: end - marker.length,
    };
  }
  return { value: before + marker + selected + marker + after, start: start + marker.length, end: end + marker.length };
}

export function toggleList(value: string, start: number, end: number, kind: "ul" | "ol"): Edit {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const marked = (l: string) => (kind === "ul" ? BULLET.test(l) : NUMBERED.test(l));
  const allMarked = lines.every((l) => !l.trim() || marked(l));
  let n = 0;
  const next = lines.map((l) => {
    if (!l.trim()) return l;
    if (allMarked) return l.replace(kind === "ul" ? /^\s*[-•*]\s+/ : /^\s*\d+[.)]\s+/, "");
    const bare = l.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, "");
    n += 1;
    return kind === "ul" ? `- ${bare}` : `${n}. ${bare}`;
  });
  const text = next.join("\n");
  return { value: value.slice(0, lineStart) + text + value.slice(lineEnd), start: lineStart, end: lineStart + text.length };
}
