import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    await logAdminAction({ admin_email: user.email.toLowerCase(), action: "logout" });
  }

  await supabase.auth.signOut();

  // 303 See Other, redirect() DEĞİL: redirect() bir route handler'da 307
  // üretir ve 307 HTTP metodunu korur — tarayıcı "/" adresine yeniden POST
  // atıyordu. 303 ise POST'u GET'e çevirir, form-submit sonrası doğru olan bu.
  return NextResponse.redirect(new URL("/", request.url), 303);
}
