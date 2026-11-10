"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useRef } from "react";

import { fromDoc, toDoc } from "@/lib/rich-text-doc";
import { cn } from "@/lib/utils";

import { FieldLabel, type useAutosave } from "./autosave";

const toolButton =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground";

// The voucher description, edited as it will look on the shop page: bold,
// italic, bullet and numbered lists (Ctrl/Cmd+B, Ctrl/Cmd+I; "- " or "1. "
// at the start of a line starts a list). The editor's document is turned
// into the plain format of src/lib/rich-text.ts, which is what is saved, when
// the field loses focus. Pasted formatting beyond those four is dropped.
export function RichTextField({
  id,
  label,
  hint,
  placeholder,
  field,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  field: ReturnType<typeof useAutosave>;
}) {
  const fieldRef = useRef(field);
  fieldRef.current = field;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: toDoc(field.value),
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: "rich-editor min-h-[9.5rem] px-3 py-2 text-sm leading-relaxed focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => fieldRef.current.change(fromDoc(editor.getJSON())),
    onBlur: () => fieldRef.current.flush(),
  });

  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id} label={label} hint={hint} state={field.state} />
      <div className="rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      bulletList: e?.isActive("bulletList") ?? false,
      orderedList: e?.isActive("orderedList") ?? false,
    }),
  });

  const buttons = [
    { key: "bold", icon: Bold, title: "Удебелен (Ctrl+B)", run: (e: Editor) => e.chain().focus().toggleBold().run() },
    { key: "italic", icon: Italic, title: "Курсив (Ctrl+I)", run: (e: Editor) => e.chain().focus().toggleItalic().run() },
    { key: "bulletList", icon: List, title: "Списък с точки", run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
    { key: "orderedList", icon: ListOrdered, title: "Номериран списък", run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-1 py-1" role="toolbar" aria-label="Форматиране">
      {buttons.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          aria-pressed={active?.[b.key] ?? false}
          disabled={!editor}
          // Keep the focus (and the selection) in the editor.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor && b.run(editor)}
          className={cn(toolButton, active?.[b.key] && "bg-accent text-foreground")}
        >
          <b.icon className="size-3.5" aria-hidden />
          <span className="sr-only">{b.title}</span>
        </button>
      ))}
    </div>
  );
}
