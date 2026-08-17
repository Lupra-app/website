/**
 * Profil formlarının durumu.
 *
 * Ayrı dosyada: `actions.ts` bir `"use server"` modülü ve oradan yalnızca
 * async fonksiyon export edilebilir.
 */
export type ProfileFormState = { error: string | null; info: string | null };

export const EMPTY_PROFILE_STATE: ProfileFormState = { error: null, info: null };

export const PROFILE_ERRORS: Record<string, string> = {
  invalid_email: "Geçerli bir e-posta adresi gir.",
  weak_password: "Şifre en az 8 karakter olmalı.",
  password_mismatch: "Şifreler birbiriyle uyuşmuyor.",
  email_taken: "Bu e-posta başka bir hesapta kullanılıyor.",
  rate_limited: "Çok fazla deneme yaptın, birkaç dakika bekle.",
  confirmation_mismatch: "Onay için e-posta adresini birebir yazman gerekiyor.",
  admin_cannot_delete:
    "Yönetici hesapları buradan silinemez. Önce /admin/admins üzerinden yöneticilikten çıkarılmalı.",
  server_error: "Kaydedilemedi, tekrar dene.",
};

export function profileError(code: string | null): string | null {
  if (!code) return null;
  return PROFILE_ERRORS[code] ?? PROFILE_ERRORS.server_error;
}
