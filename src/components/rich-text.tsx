import { Fragment } from "react";

import { parseRichText, type Line } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

// Renders the voucher description format (src/lib/rich-text.ts) as React
// elements: text only, so nothing in it can become HTML. Used on the shop
// page and in the admin's preview.

function Spans({ line }: { line: Line }) {
  return (
    <>
      {line.map((span, i) => {
        if (span.bold) return <strong key={i} className="font-bold text-brand-ink">{span.text}</strong>;
        if (span.italic) return <em key={i}>{span.text}</em>;
        return <Fragment key={i}>{span.text}</Fragment>;
      })}
    </>
  );
}

export function RichText({ source, className }: { source: string | null | undefined; className?: string }) {
  const blocks = parseRichText(source);
  if (!blocks.length) return null;
  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 ? <br /> : null}
                  <Spans line={line} />
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.type === "ul" ? "ul" : "ol";
        return (
          <List key={i} className={cn("space-y-1 pl-5", block.type === "ul" ? "list-disc" : "list-decimal")}>
            {block.items.map((item, j) => (
              <li key={j} className="pl-1">
                <Spans line={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
