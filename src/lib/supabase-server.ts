import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components can't write cookies (Next.js throws), only Route
// Handlers and Server Actions can — proxy.ts refreshes the session on every
// request, so a Server Component's inability to persist a refreshed cookie
// here is harmless as long as proxy.ts stays wired up.
export async function getSupabaseServer() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Eskiden `!` ile susturuluyordu; eksik env bu durumda anlaşılmaz bir
    // runtime hatasına dönüşüyordu.
    throw new Error(
      "Supabase yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil."
    );
  }

  return createServerClient(
    url,
    anonKey,
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
            // Called from a Server Component — ignore, proxy.ts handles it.
          }
        },
      },
    }
  );
}
