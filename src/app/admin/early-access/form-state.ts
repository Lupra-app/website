/**
 * Erken erişim kaydı güncelleme formunun durumu.
 *
 * Ayrı dosyada: `actions.ts` bir `"use server"` modülü ve oradan yalnızca
 * async fonksiyon export edilebilir.
 */
export type EarlyAccessFormState = { error: string | null; saved: boolean };

export const EMPTY_EARLY_ACCESS_STATE: EarlyAccessFormState = { error: null, saved: false };

export const EARLY_ACCESS_ERRORS: Record<string, string> = {
  invalid_status: "Geçersiz durum seçildi.",
  not_found: "Bu kayıt bulunamadı — silinmiş olabilir.",
  note_too_long: "Not en fazla 1000 karakter olabilir.",
  server_error: "Kaydedilemedi, tekrar dene.",
};

export const STATUS_LABELS = {
  new: "Yeni",
  invited: "Davet edildi",
  joined: "Katıldı",
} as const;

export type EarlyAccessStatusKey = keyof typeof STATUS_LABELS;

/** Rozet renkleri — listede ve detayda aynı görünsün diye tek yerde. */
export const STATUS_BADGE: Record<EarlyAccessStatusKey, string> = {
  new: "border-white/15 bg-white/5 text-muted",
  invited: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  joined: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as EarlyAccessStatusKey] ?? status;
}

export function statusBadge(status: string): string {
  return STATUS_BADGE[status as EarlyAccessStatusKey] ?? STATUS_BADGE.new;
}
