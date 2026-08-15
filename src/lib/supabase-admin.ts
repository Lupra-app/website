import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, so this file must never be imported by
// client components. The `server-only` import above makes that a build
// error instead of a runtime leak if someone does it by accident.
export function getSupabaseAdmin() {
  // SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_URL aynı değeri tutuyor; ikisini de
  // kabul etmek, Vercel'de birinin tanımlanmayı unutulması durumunda panelin
  // sessizce kilitlenmesini önlüyor.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !url && "SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL)",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Supabase yapılandırması eksik: ${missing.join(", ")} tanımlı değil. .env.example'a bak.`
    );
  }

  return createClient(url!, serviceRoleKey!, {
    auth: { persistSession: false },
  });
}
