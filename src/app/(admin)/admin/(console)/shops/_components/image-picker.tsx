"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { clearShopImage, importShopImage, uploadShopImage } from "@/actions/media";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { Suggestion } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

import { fieldClass } from "./autosave";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/x-icon";

type Kind = "logo" | "cover";

// Logo or cover for one shop. Every route ends with a copy in our own
// storage: upload a file, copy from a URL, or take a crawl suggestion.
export function ImagePicker({
  shopId,
  kind,
  url,
  suggestions,
}: {
  shopId: string;
  kind: Kind;
  url: string | null;
  suggestions: Suggestion[] | null;
}) {
  const [current, setCurrent] = useState(url);
  const [remote, setRemote] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const label = kind === "logo" ? "Лого" : "Корица";

  const run = (call: () => Promise<ActionResult<{ url: string } | null>>, success: string) =>
    startTransition(async () => {
      try {
        const result = await call();
        if (!result) toast.error("Няма отговор от сървъра.");
        else if (!result.ok) toast.error(result.error);
        else {
          setCurrent(result.data?.url ?? null);
          toast.success(success);
        }
      } catch {
        toast.error("Връзката със сървъра прекъсна. Нищо не е записано.");
      }
    });

  const upload = (file: File) => {
    const form = new FormData();
    form.set("shopId", shopId);
    form.set("kind", kind);
    form.set("file", file);
    run(() => uploadShopImage(form), `${label}: качено`);
  };

  const copyFrom = (source: string) => run(() => importShopImage(shopId, kind, source), `${label}: копирано`);

  return (
    <div className={cn("space-y-2", pending && "opacity-60")}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">
          {kind === "logo" ? "квадратно, до 2 MB" : "широко ~16:9, до 2 MB"}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-white",
            kind === "logo" ? "size-16 rounded-[14px]" : "h-16 w-28 rounded-lg"
          )}
        >
          {current ? (
            // Our own storage copy; a plain img avoids next/image host config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt="" className={cn("size-full", kind === "logo" ? "object-contain p-1" : "object-cover")} />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) upload(file);
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
              <Upload /> Качи файл
            </Button>
            {current ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => clearShopImage(shopId, kind), `${label}: премахнато`)}
              >
                Премахни
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <input
              value={remote}
              onChange={(event) => setRemote(event.target.value)}
              placeholder="https://… — копие от адрес"
              aria-label={`${label}: адрес на изображение`}
              className={fieldClass}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !remote.trim()}
              onClick={() => {
                copyFrom(remote.trim());
                setRemote("");
              }}
            >
              Запази копие
            </Button>
          </div>
        </div>
      </div>

      {suggestions?.length ? (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">От обхождането:</div>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s.value} className="flex items-center gap-2 rounded-md border bg-background p-1 pr-2" title={`${s.value}\n${s.source}`}>
                {/* Merchant image preview; only stored after "Използвай". */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.value}
                  alt=""
                  referrerPolicy="no-referrer"
                  className={cn("rounded border object-contain", kind === "logo" ? "size-10" : "h-10 w-16 object-cover")}
                />
                <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={pending} onClick={() => copyFrom(s.value)}>
                  Използвай
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : suggestions ? (
        <div className="text-[11px] text-muted-foreground">Няма предложения от обхождането.</div>
      ) : null}
    </div>
  );
}
