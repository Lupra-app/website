/**
 * Yönetici formlarının useActionState durumu.
 *
 * Ayrı bir dosyada, çünkü `actions.ts` bir `"use server"` modülü ve oradan
 * yalnızca async fonksiyon export edilebilir — bir nesne export etmek
 * "A use server file can only export async functions" hatası veriyor.
 */
export type AdminFormState = { error: string | null; success: string | null };

export const EMPTY_ADMIN_STATE: AdminFormState = { error: null, success: null };

export const ADD_ADMIN_ERRORS: Record<string, string> = {
  invalid_email: "Geçerli bir e-posta adresi gir.",
  already_exists: "Bu e-posta zaten yönetici listesinde.",
  server_error: "Eklenemedi, tekrar dene.",
};

export const REMOVE_ADMIN_ERRORS: Record<string, string> = {
  cannot_remove_self: "Kendini yöneticilikten çıkaramazsın.",
  last_admin: "En az bir yönetici kalmalı.",
  not_found: "Bu yönetici zaten çıkarılmış.",
  server_error: "Çıkarılamadı, tekrar dene.",
};
