/**
 * Giriş / kayıt / şifre formlarının paylaştığı durum ve mesajlar.
 *
 * Ayrı dosyada: `actions.ts` bir `"use server"` modülü ve oradan yalnızca
 * async fonksiyon export edilebilir.
 */
export type AuthFormState = {
  error: string | null;
  /** Kayıt sonrası "e-postana bak" ekranına geçmek için. */
  emailSent: string | null;
  info: string | null;
};

export const EMPTY_AUTH_STATE: AuthFormState = { error: null, emailSent: null, info: null };

export const MIN_PASSWORD = 8;

/**
 * Hata mesajları Türkçeleştirilirken KASITLI olarak belirsiz tutuldu:
 * "bu e-posta kayıtlı değil" demek, saldırgana hangi adreslerin sistemde
 * olduğunu söyler (kullanıcı sayımı). Giriş hatası tek bir mesaj.
 */
export const AUTH_ERRORS: Record<string, string> = {
  invalid_email: "Geçerli bir e-posta adresi gir.",
  weak_password: `Şifre en az ${MIN_PASSWORD} karakter olmalı.`,
  password_mismatch: "Şifreler birbiriyle uyuşmuyor.",
  invalid_credentials: "E-posta veya şifre hatalı.",
  email_not_confirmed: "Önce e-postandaki doğrulama bağlantısına tıkla.",
  email_taken: "Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.",
  rate_limited: "Çok fazla deneme yaptın, birkaç dakika bekle.",
  provider_disabled: "Bu giriş yöntemi henüz etkin değil.",
  server_error: "Bir şeyler ters gitti, birazdan tekrar dene.",
};

export function authError(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERRORS[code] ?? AUTH_ERRORS.server_error;
}

/**
 * Supabase'in İngilizce hata mesajlarını kendi kodlarımıza çevirir.
 * Mesaj metnine bakmak kırılgan ama Supabase her durum için ayrı bir kod
 * vermiyor; en azından tek yerde toplu duruyor.
 */
export function mapSupabaseAuthError(message: string, status?: number): string {
  const m = message.toLowerCase();
  if (status === 429 || m.includes("rate limit")) return "rate_limited";
  if (m.includes("already registered") || m.includes("already been registered")) return "email_taken";
  if (m.includes("invalid login credentials")) return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  if (m.includes("password should be")) return "weak_password";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return "provider_disabled";
  }
  return "server_error";
}

/** Açık yönlendirmeyi engeller: yalnızca site-içi göreli yollar. */
export function safeNext(value: string | null | undefined, fallback = "/profil"): string {
  if (!value) return fallback;
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
