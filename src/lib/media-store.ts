import "server-only";

import type { ActionResult } from "@/lib/action-result";
import { MAX_IMAGE_BYTES, looksLikeSvg, sniffImage } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared by the shop image actions (src/actions/media.ts) and the cover
// library (src/actions/covers.ts). Not a Server Action file: nothing here is
// callable from the browser; callers check the session first.

export const MEDIA_BUCKET = "shop-media";

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

// SVG is never stored as SVG (it can carry scripts and links): it is drawn
// into a PNG with resvg, which runs no scripts and loads no external files
// or URLs, so only the shapes and text of the drawing survive.
async function rasterizeSvg(bytes: Uint8Array, width: number): Promise<Uint8Array | string> {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const svg = new TextDecoder().decode(bytes);
    const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true } })
      .render()
      .asPng();
    if (png.byteLength > MAX_IMAGE_BYTES) return "SVG файлът става над 2 MB като PNG.";
    return new Uint8Array(png);
  } catch {
    return "SVG файлът не можа да се прочете.";
  }
}

// Checks the bytes are an image we accept (SVG becomes a PNG `svgWidth`
// wide) and stores them at `<prefix>-<time>.<ext>` in the bucket. Returns the
// public URL of our copy.
export async function storeMediaBytes(
  prefix: string,
  svgWidth: number,
  input: Uint8Array
): Promise<ActionResult<{ url: string }>> {
  let bytes = input;
  if (bytes.byteLength > MAX_IMAGE_BYTES) return fail("Файлът е над 2 MB.");
  let type = sniffImage(bytes);
  if (!type && looksLikeSvg(bytes)) {
    const png = await rasterizeSvg(bytes, svgWidth);
    if (typeof png === "string") return fail(png);
    bytes = png;
    type = { mime: "image/png", ext: "png" };
  }
  if (!type) return fail("Неподдържан формат. Позволени са PNG, JPEG, WebP, GIF, ICO и SVG.");

  const supabase = createAdminClient();
  const path = `${prefix}-${Date.now()}.${type.ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, toArrayBuffer(bytes), {
    contentType: type.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return fail(`Грешка при качване: ${error.message}`);
  return { ok: true, data: { url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl } };
}
