import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware-client";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Scoped strictly to the new feature routes.
 *
 * The following are intentionally excluded and will NEVER be touched:
 *   - /morningmeeples  (existing poll voting page)
 *   - /sauron          (existing admin panel)
 *   - /                (home page)
 *   - all static assets, _next internals, favicon
 */
export const config = {
  matcher: [
    "/auth",
    "/auth/:path*",
    "/create",
    "/create/:path*",
    "/manage",
    "/manage/:path*",
  ],
};
