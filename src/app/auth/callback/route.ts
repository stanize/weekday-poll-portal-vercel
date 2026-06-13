import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/manage";

  const errorRedirect = NextResponse.redirect(
    `${origin}/auth?error=invalid_link&next=${encodeURIComponent(next)}`
  );

  if (!code) return errorRedirect;

  // Build the success redirect response before calling exchangeCodeForSession
  // so that setAll can write session cookies directly onto this response object.
  // next/headers cookieStore is NOT automatically merged onto explicit NextResponse
  // objects in Next.js 16, so we must own the cookie attachment ourselves.
  const cookieStore = await cookies();
  const successRedirect = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successRedirect.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return errorRedirect;

  return successRedirect;
}
