// Browser-only: makes an image small enough to upload (the shop-media bucket
// takes 2 MB per file, and Vercel refuses request bodies over 4.5 MB). A
// file already under the limit, an SVG (drawn into a PNG on the server) or
// anything the browser cannot decode is returned as it is. Others are drawn
// at most `maxWidth` wide and saved as WebP, lowering the quality and then
// the size until it fits.

const LIMIT = 2 * 1024 * 1024 - 64 * 1024; // a little under 2 MB

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

export async function shrinkImage(file: File, maxWidth: number): Promise<File> {
  if (file.size <= LIMIT || file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  let width = Math.min(maxWidth, bitmap.width);
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const height = Math.round((bitmap.height * width) / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [0.92, 0.85, 0.75]) {
        const blob = await toBlob(canvas, quality);
        if (blob && blob.size <= LIMIT) {
          return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
        }
      }
      width = Math.round(width * 0.8);
    }
    return file;
  } finally {
    bitmap.close();
  }
}
