import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Data Access Layer — panelin tek yetkilendirme kapısı.
 *
 * Her sayfa, server action ve route handler yetkiyi BURADAN doğrular; hiçbiri
 * layout'a veya proxy.ts'e güvenmez. Layout navigasyonda yeniden render
 * olmayabilir ve server action'lar layout'tan hiç geçmez — yani ikisi de tek
 * savunma hattı olamaz.
 *
 * Okumalar service-role ile yapılır: tabloların RLS'i açık ve policy'si yok,
 * yani anon key ile yapılan her SELECT sessizce BOŞ döner (hata değil). Bu
 * yüzden yetki kontrolü tamamen bu katmanın sorumluluğunda.
 */

export type AdminSession = { userId: string; email: string };

/**
 * E-posta allowlist'te mi? Service-role ile sorgular (RLS bypass).
 *
 * Tüm satırları çekip karşılaştırma JS tarafında yapılıyor. Sebebi güvenlik:
 * `.ilike()` bir KALIP eşleşmesidir ve `%` e-postanın yerel kısmında geçerli
 * bir karakterdir (RFC 5321) — allowlist'e `%@x.com` gibi bir satır düşerse
 * ilike her adresi eşleştirir. `.eq()` ise büyük/küçük harf duyarlıdır ve
 * elle girilmiş "Umut@gmail.com" satırını ıskalar. Küçük harfe indirip tam
 * karşılaştırmak ikisini de çözer; admin_users onlarca satırlık bir tablo,
 * tam okuma maliyeti yok.
 */
export const isAdminEmail = cache(async (email: string | null | undefined): Promise<boolean> => {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const { data, error } = await getSupabaseAdmin().from("admin_users").select("email");

    if (error) {
      // E-postayı LOGLAMA — production loglarına PII yazmak istemiyoruz.
      console.error("[dal] admin_users sorgusu başarısız:", error.code, error.message);
      return false;
    }
    return (data ?? []).some((row) => row.email.trim().toLowerCase() === normalized);
  } catch (err) {
    console.error("[dal] admin_users sorgusunda beklenmeyen hata:", err);
    return false;
  }
});

/**
 * Oturum + allowlist kontrolü. Yönlendirme YAPMAZ, null döner.
 *
 * cache(): auth.getUser() her çağrıda Supabase Auth sunucusuna ağ isteği
 * atıyor. Aynı istek içinde layout, sayfa ve action'ın hepsi bunu çağırdığı
 * için memoize edilmeden istek başına 3-4 round trip olurdu.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  if (!(await isAdminEmail(user.email))) return null;

  return { userId: user.id, email: user.email.toLowerCase() };
});

/**
 * Sayfa, layout ve server action'lar için. Yetki yoksa /login'e yönlendirir
 * ve asla dönmez.
 *
 * Yan etki (kasıtlı): getSupabaseServer() -> cookies() zinciri sayfayı
 * dinamik render'a zorlar. Okumalar service-role'e geçtiği için sayfalar
 * artık kendiliğinden cookies()'e dokunmuyor; bu çağrı olmasa Next bazı
 * admin sayfalarını build sırasında statik prerender edip boş veriyle
 * dondurabilirdi.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  // Oturum var ama allowlist'te değil mi, yoksa hiç oturum yok mu? Ayırmak
  // login sayfasında doğru mesajı göstermek için gerekli.
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/login?error=forbidden" : "/login");
}

/**
 * Route handler'lar için. redirect() yerine Response döndürür.
 *
 * Route handler içinde redirect() 307 üretir ve 307 HTTP metodunu KORUR —
 * bir POST endpoint'i redirect ederse tarayıcı hedefe yeniden POST atar.
 * Bu yüzden API tarafında hiç redirect kullanmıyoruz.
 */
export async function requireAdminApi(): Promise<
  { ok: true; session: AdminSession } | { ok: false; response: Response }
> {
  const session = await getAdminSession();
  if (session) return { ok: true, session };

  return {
    ok: false,
    response: Response.json({ error: "unauthorized" }, { status: 401 }),
  };
}
