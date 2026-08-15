/** Formların ve API route'larının paylaştığı doğrulama kuralları. */

/**
 * Kasıtlı olarak muhafazakâr, RFC 5322 değil: gerçek bir kayıt formunun
 * gördüğü yazım hatalarını ("asdf", "a@", sondaki boşluk) yakalar, geçerli
 * adresleri reddetmez. Tarayıcıdaki type="email" zaten bariz durumu engelliyor;
 * bu, JS submit'i doğrudan yaptığında da çalışan asıl kontrol.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_EMAIL_LENGTH = 254;

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(value);
}

/** URL-güvenli slug: küçük harf + rakam, tire ile ayrılmış. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
