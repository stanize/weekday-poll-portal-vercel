import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * SSR-safe Supabase client for Server Components and Route Handlers.
 *
 * Use this in:
 *   - src/app/create/page.tsx
 *   - src/app/manage/page.tsx
 *   - src/app/auth/callback/route.ts
 *
 * Do NOT use this in Client Components ("use client").
 * Do NOT use this in the existing morningmeeples / sauron pages — they use client.ts.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — cookies can only be set
            // from Route Handlers or Server Actions. Safe to ignore here;
            // the middleware will handle session refresh.
          }
        },
      },
    }
  );
}
