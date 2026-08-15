// Admin allowlist check: queries admin_users table with service-role key
// (bypass RLS since public access is not allowed)

import { createClient } from "@supabase/supabase-js";

export async function isAdminAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  try {
    // Use service-role key to bypass RLS (no cookies needed)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .limit(1);

    console.log("[isAdminAllowed] Query result for", email, ":", data);
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error("[isAdminAllowed] Error checking email:", email, err);
    return false;
  }
}
