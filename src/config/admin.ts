// NOTE: Allowlist moved to Supabase admin_users table.
// This file kept for reference/fallback only.
// See src/lib/admin-auth.ts for database-backed authorization.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function isAdminAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
