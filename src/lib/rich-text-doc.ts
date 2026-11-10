// Converts between the voucher description format (src/lib/rich-text.ts) and
// the document tree of the admin's visual editor (Tiptap/ProseMirror JSON).
// What is stored is always the plain text format; the tree only lives in the
// editor. Plain types here, so this file imports no editor code.

import { parseRichText, type Line } from "./rich-text";

export type DocNode = {
  type: string;
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
  content?: DocNode[];
};

function lineToNodes(line: Line): DocNode[] {
  return line
    .filter((span) => span.text)
    .map((span) => {
      const marks = span.bold ? [{ type: "bold" }] : span.italic ? [{ type: "italic" }] : undefined;
      return marks ? { type: "text", text: span.text, marks } : { type: "text", text: span.text };
    });
}

function paragraph(lines: Line[]): DocNode {
  const content: DocNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: "hardBreak" });
    content.push(...lineToNodes(line));
  });
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

export function toDoc(source: string | null | undefined): DocNode {
  const content = parseRichText(source).map((block): DocNode => {
    if (block.type === "p") return paragraph(block.lines);
    return {
      type: block.type === "ul" ? "bulletList" : "orderedList",
      content: block.items.map((item) => ({ type: "listItem", content: [paragraph([item])] })),
    };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// Text with a mark keeps its outer spaces outside the markers, because
// "*word *" or "** word**" would not read back as formatting.
function inlineText(nodes: DocNode[] | undefined): string {
  let out = "";
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      out += "\n";
      continue;
    }
    const text = (node.text ?? "").replace(/\n/g, " ");
    const marks = new Set((node.marks ?? []).map((m) => m.type));
    const marker = marks.has("bold") ? "**" : marks.has("italic") ? "*" : "";
    const core = text.trim();
    if (!marker || !core) {
      out += text;
      continue;
    }
    const lead = text.slice(0, text.length - text.trimStart().length);
    const trail = text.slice(text.trimEnd().length);
    out += `${lead}${marker}${core}${marker}${trail}`;
  }
  return out;
}

// A list item's text: its paragraphs on one line each, nested lists flattened.
function itemLines(item: DocNode): string[] {
  const lines: string[] = [];
  for (const child of item.content ?? []) {
    if (child.type === "paragraph") {
      lines.push(
        ...inlineText(child.content)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      );
    } else if (child.content) {
      for (const nested of child.content) lines.push(...itemLines(nested));
    }
  }
  return lines;
}

export function fromDoc(doc: DocNode): string {
  const blocks: string[] = [];
  for (const node of doc.content ?? []) {
    if (node.type === "bulletList" || node.type === "orderedList") {
      const items = (node.content ?? []).map((item) => itemLines(item).join(" ")).filter(Boolean);
      if (items.length) {
        blocks.push(items.map((text, i) => (node.type === "bulletList" ? `- ${text}` : `${i + 1}. ${text}`)).join("\n"));
      }
      continue;
    }
    const text = inlineText(node.content)
      .split("\n")
      .map((l) => l.trimEnd())
      .join("\n")
      .trim();
    if (text) blocks.push(text);
  }
  return blocks.join("\n\n");
}
