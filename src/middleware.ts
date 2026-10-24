import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Only the admin needs a session; the public site never touches auth.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
