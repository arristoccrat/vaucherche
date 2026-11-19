"use client";

import { Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { renameLibraryCover, setLibraryCoverArchived, uploadLibraryCover } from "@/actions/covers";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { LibraryCover } from "@/lib/queries/covers";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg";
const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Cover = LibraryCover & { shops: number };

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult<unknown>>, success: string, after?: () => void) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) return void toast.error(result.error);
        toast.success(success);
        after?.();
      } catch {
        toast.error("Връзката със сървъра прекъсна. Нищо не е записано.");
      }
    });
  return { pending, run };
}

export function CoverLibrary({ covers }: { covers: Cover[] }) {
  const active = covers.filter((c) => !c.archivedAt);
  const archived = covers.filter((c) => c.archivedAt);
  return (
    <div className="space-y-8">
      <UploadForm />
      {active.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((c) => (
            <CoverItem key={c.id} cover={c} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Още няма корици.</p>
      )}
      {archived.length ? (
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-medium">Изтрити ({archived.length})</summary>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((c) => (
              <CoverItem key={c.id} cover={c} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function UploadForm() {
  const { pending, run } = useRun();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const submit = () => {
    if (!file) return void toast.error("Избери файл.");
    const form = new FormData();
    form.set("name", name);
    form.set("file", file);
    run(() => uploadLibraryCover(form), "Корицата е качена", () => {
      setName("");
      setFile(null);
    });
  };

  return (
    <section className={cn("space-y-3 rounded-xl border p-4", pending && "opacity-60")}>
      <h2 className="text-sm font-medium">Нова корица</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex h-16 w-52 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-foreground bg-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview before upload
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] text-muted-foreground">поне 2000 px, ~3:1</span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => fileRef.current?.click()}>
          <Upload /> {file ? "Друг файл" : "Избери файл"}
        </Button>
        <label className="min-w-56 flex-1 space-y-1">
          <span className="text-xs font-medium">Име</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="напр. Козметика — розова"
            maxLength={80}
            className={fieldClass}
          />
        </label>
        <Button type="button" size="sm" disabled={pending || !file || !name.trim()} onClick={submit}>
          Качи
        </Button>
      </div>
    </section>
  );
}

function CoverItem({ cover }: { cover: Cover }) {
  const { pending, run } = useRun();
  const [name, setName] = useState(cover.name);
  const archived = Boolean(cover.archivedAt);

  const saveName = () => {
    const next = name.trim();
    if (!next || next === cover.name) return setName(cover.name);
    run(() => renameLibraryCover(cover.id, next), "Името е записано");
  };

  return (
    <li className={cn("space-y-2 rounded-xl border p-3", pending && "opacity-60", archived && "opacity-70")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- our own storage copy */}
      <img src={cover.url} alt="" className="aspect-[3.3/1] w-full rounded-lg border-2 border-foreground object-cover" />
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={saveName}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label="Име на корицата"
        maxLength={80}
        disabled={archived}
        className={fieldClass}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{cover.shops ? `ползва се от ${cover.shops} магазина` : "не се ползва"}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          disabled={pending}
          onClick={() =>
            run(() => setLibraryCoverArchived(cover.id, !archived), archived ? "Корицата е възстановена" : "Корицата е изтрита")
          }
        >
          {archived ? "Възстанови" : "Изтрий"}
        </Button>
      </div>
    </li>
  );
}
