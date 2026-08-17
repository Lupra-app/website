import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";

/**
 * OAuth ve e-posta doğrulama dönüş noktası.
 *
 * ÖNEMLİ DEĞİŞİKLİK: burası eskiden allowlist'te olmayan HERKESİ çıkış
 * yaptırıyordu, çünkü sitede yalnızca yönetici hesabı vardı. Artık normal
 * kullanıcı hesapları da var, dolayısıyla kimse çıkış yaptırılmıyor.
 *
 * Yönetici kapısı bundan etkilenmiyor: /admin'e erişim hâlâ requireAdmin()
 * ile, admin_users allowlist'i üzerinden karara bağlanıyor. Burada oturum
 * açmak yalnızca "giriş yapmış kullanıcı" olmak demek.
 */
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
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profil";

  // Supabase hata durumunda koda değil, error parametrelerine yönlendiriyor
  // (ör. kullanıcı OAuth ekranında "reddet" derse).
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(new URL("/giris?error=auth_failed", base));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/giris?error=auth_failed", base));
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/giris?error=auth_failed", base));
  }

  // Yönetici girişleri denetim kaydına yazılıyor; normal kullanıcı girişleri
  // yazılmıyor — audit_logs panel işlemlerinin kaydı, ziyaretçi trafiğinin değil.
  if (await isAdminEmail(data.user.email)) {
    await logAdminAction({ admin_email: data.user.email.toLowerCase(), action: "login" });
  }

  return NextResponse.redirect(new URL(next, base));
}
