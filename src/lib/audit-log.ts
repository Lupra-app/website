import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface LogEntry {
  admin_email: string;
  action: string;
  details?: Record<string, unknown>;
}

export async function logAdminAction(entry: LogEntry): Promise<void> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    await supabase.from("audit_logs").insert({
      admin_email: entry.admin_email,
      action: entry.action,
      details: entry.details || null,
    });
  } catch (err) {
    // Silently fail — logging shouldn't break the app
    console.error("Audit log error:", err);
  }
}
