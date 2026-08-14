import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Deliberately conservative, not RFC 5322: catches the typos a real signup
// form sees ("asdf", "a@", trailing spaces) without rejecting valid
// addresses. The browser's type="email" already blocks the obvious case;
// this is the check that still runs when JS handles the submit directly.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : "";

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("early_access").insert({ email });

    // Unique violation (already signed up) is not a failure from the
    // visitor's point of view — they're on the list either way.
    if (error && error.code !== "23505") {
      console.error("early_access insert failed:", error);
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  } catch (err) {
    console.error("early_access insert failed:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
