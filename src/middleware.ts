import { NextResponse, type NextRequest } from "next/server";

import { COMING_SOON_PATH, PREVIEW_COOKIE, isSiteLaunched } from "@/lib/site";
import { updateSession } from "@/lib/supabase/middleware";

const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Pre-launch gate for the public site. Not a security boundary (the site only
// ever shows published shops); it decides who sees the unfinished site.
function prelaunchGate(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = process.env.PREVIEW_TOKEN;
  const preview = searchParams.get("preview");

  // /?preview=<token> turns preview on, /?preview=off turns it off.
  if (preview !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview");
    const response = NextResponse.redirect(url);
    if (preview === "off") {
      response.cookies.delete(PREVIEW_COOKIE);
    } else if (token && preview === token) {
      response.cookies.set(PREVIEW_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: PREVIEW_MAX_AGE,
        path: "/",
      });
    }
    return response;
  }

  const previewing = Boolean(token) && request.cookies.get(PREVIEW_COOKIE)?.value === token;
  if (previewing || pathname === COMING_SOON_PATH) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = COMING_SOON_PATH;
  url.search = "";
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only the admin needs a session; the public site never touches auth.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return updateSession(request);
  }

  if (isSiteLaunched()) {
    // After launch the placeholder has no reason to exist.
    if (pathname === COMING_SOON_PATH) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return prelaunchGate(request);
}

export const config = {
  // Everything except Next internals and static files.
  matcher: [
    "/((?!_next/|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
