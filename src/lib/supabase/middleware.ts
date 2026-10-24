import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

const PUBLIC_PATHS = ["/admin/login", "/admin/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

// Runs for /admin/* only (see src/middleware.ts). Refreshes the session
// cookie and routes signed-out requests to /admin/login.
// This is routing only: every Server Action re-checks the user itself.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Server Actions authorise themselves and answer "not signed in" as data;
  // redirecting their POST would hand the caller an HTML page instead.
  const isServerAction = request.headers.has("next-action");

  // API routes answer in JSON; a redirect to an HTML login page is useless
  // to a fetch() caller.
  if (!user && pathname.startsWith("/admin/api/")) {
    return NextResponse.json({ error: "Не сте влезли." }, { status: 401 });
  }

  if (!user && !isPublicPath(pathname) && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/shops";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
