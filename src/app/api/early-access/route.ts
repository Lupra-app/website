import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = checkRateLimit(`early-access:${clientIp(request)}`);
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? normalizeEmail((body as { email: unknown }).email)
      : "";

  if (!isValidEmail(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("early_access").insert({ email });

    // Unique violation (already signed up) is not a failure from the
    // visitor's point of view — they're on the list either way.
    if (error && error.code !== "23505") {
      console.error("early_access insert failed:", error.code, error.message);
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  } catch (err) {
    console.error("early_access insert failed:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
