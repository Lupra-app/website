import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, so this file must never be imported by
// client components. The `server-only` import above makes that a build
// error instead of a runtime leak if someone does it by accident.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — see .env.local.example"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
