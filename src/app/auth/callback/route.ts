import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Vercel gibi ters proxy arkasında request.url iç host'u gösterebilir;
  // yönlendirmenin kullanıcının gerçekten kullandığı host'a gitmesi lazım.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = forwardedHost ? `${proto}://${forwardedHost}` : origin;

  // Sadece site-içi göreli yollar kabul edilir. "//evil.com" protokol-göreli
  // bir URL olduğu için ayrıca eleniyor; aksi halde açık yönlendirme olurdu.
  const rawNext = searchParams.get("next");
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", base));
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", base));
  }

  // Allowlist kontrolü BURADA yapılmalı. Eskiden oturum açılıp /admin'e
  // yönlendiriliyor, layout da /login'e geri atıyordu — ama çerez silinmediği
  // için kullanıcı sebebini göremediği bir döngüde kalıyordu.
  // isAdminEmail'i doğrudan token'daki e-postayla çağırıyoruz; yeni yazılan
  // çerezin bu istek içinde okunabilir olmasına bel bağlamıyoruz.
  if (!(await isAdminEmail(data.user.email))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=forbidden", base));
  }

  await logAdminAction({ admin_email: data.user.email.toLowerCase(), action: "login" });

  return NextResponse.redirect(new URL(next, base));
}
