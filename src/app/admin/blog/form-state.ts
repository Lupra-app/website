/**
 * Blog formlarının durumu.
 *
 * Ayrı dosyada: `actions.ts` bir `"use server"` modülü ve oradan yalnızca
 * async fonksiyon export edilebilir.
 */
export type PostFormState = { error: string | null };

export const EMPTY_POST_STATE: PostFormState = { error: null };

export const POST_ERRORS: Record<string, string> = {
  invalid_title: "Başlık boş olamaz (en fazla 160 karakter).",
  invalid_slug: "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. whatsapp-agent-nedir).",
  reserved_slug: "Bu slug sistem tarafından kullanılıyor, başka bir tane seç.",
  slug_taken: "Bu slug'a sahip bir yazı zaten var.",
  invalid_excerpt: "Özet en fazla 300 karakter olabilir.",
  not_found: "Bu yazı bulunamadı — başka bir sekmede silinmiş olabilir.",
  server_error: "Sunucu hatası — kayıt yapılamadı, tekrar dene.",
};

export type CommentActionState = { error: string | null; done: boolean };

export const EMPTY_COMMENT_STATE: CommentActionState = { error: null, done: false };

export const COMMENT_STATUS_LABELS = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  spam: "Spam",
} as const;

export type CommentStatusKey = keyof typeof COMMENT_STATUS_LABELS;

export const COMMENT_STATUS_BADGE: Record<CommentStatusKey, string> = {
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  approved: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  spam: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function commentStatusLabel(status: string): string {
  return COMMENT_STATUS_LABELS[status as CommentStatusKey] ?? status;
}

export function commentStatusBadge(status: string): string {
  return COMMENT_STATUS_BADGE[status as CommentStatusKey] ?? COMMENT_STATUS_BADGE.pending;
}
