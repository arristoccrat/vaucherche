// Image checks shared by the upload and import actions. Pure functions; the
// network fetch lives in src/actions/media.ts.

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // matches the shop-media bucket limit

export type ImageType = { mime: string; ext: string };

// Identify the format from the bytes, not from the claimed content type or
// file name. SVG is deliberately not accepted (it can carry scripts).
export function sniffImage(bytes: Uint8Array): ImageType | null {
  const b = (i: number) => bytes[i];
  if (bytes.length < 12) return null;
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return { mime: "image/png", ext: "png" };
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return { mime: "image/gif", ext: "gif" };
  if (
    b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
    b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (b(0) === 0x00 && b(1) === 0x00 && b(2) === 0x01 && b(3) === 0x00) return { mime: "image/x-icon", ext: "ico" };
  return null;
}

// Only public http(s) hosts: no localhost, private ranges, link-local
// (cloud metadata), or bare IPs in reserved space. Hostnames that resolve to
// private addresses are not caught here; acceptable for a signed-in-only
// admin action.
export function isSafeRemoteUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host.includes(".") && !host.includes(":")) return false; // "localhost", intranet names
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  if (host.includes(":")) {
    // IPv6 literal: allow only global unicast (2000::/3).
    if (!/^[23][0-9a-f]{3}:/.test(host)) return false;
  }
  return true;
}
