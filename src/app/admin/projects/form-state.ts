/**
 * Proje formunun useActionState durumu.
 *
 * Ayrı bir dosyada, çünkü `actions.ts` bir `"use server"` modülü ve oradan
 * yalnızca async fonksiyon export edilebilir — bir nesne export etmek
 * "A use server file can only export async functions" hatası veriyor.
 */
export type ProjectFormState = { error: string | null };

export const EMPTY_PROJECT_STATE: ProjectFormState = { error: null };

export const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  invalid_title: "Başlık boş olamaz (en fazla 140 karakter).",
  invalid_slug: "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. whatsapp-agent).",
  reserved_slug: "Bu slug sistem tarafından kullanılıyor, başka bir tane seç.",
  slug_taken: "Bu slug'a sahip bir proje zaten var.",
  invalid_summary: "Özet en fazla 300 karakter olabilir.",
  content_too_long: "İçerik çok uzun (100.000 karakter sınırı).",
  not_found: "Bu proje bulunamadı — başka bir sekmede silinmiş olabilir.",
  server_error: "Sunucu hatası — kayıt yapılamadı, tekrar dene.",
};
