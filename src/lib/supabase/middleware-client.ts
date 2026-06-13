import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client scoped to the middleware context.
 * Reads and writes session cookies on every matching request so
 * the user session stays alive without the user having to re-authenticate.
 *
 * Only called from src/middleware.ts — do not import elsewhere.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: calling getUser() refreshes the session if the access token
  // has expired. Do not remove this call — it is what keeps sessions alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is not authenticated and is trying to access a protected route,
  // redirect them to the auth page, preserving their intended destination.
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith("/create") || pathname.startsWith("/manage");

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
