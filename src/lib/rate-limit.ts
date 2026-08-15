/**
 * Bellek içi, sabit pencereli hız sınırlayıcı.
 *
 * DÜRÜST SINIR: Vercel'de bellek her sunucu örneğine ait ve örnekler gelip
 * gider. Yani bu, kaba kuvvet gönderimini yavaşlatan bir engel; kesin bir
 * kota değil. Gerçek bir sınır gerekirse early_access tablosuna ip_hash
 * kolonu ekleyip sayımı veritabanında yapmak gerekir.
 */

type Hit = number[];
const buckets = new Map<string, Hit>();

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

/** Map'in sınırsız büyümesini engeller (uzun ömürlü sunucu örneklerinde). */
const MAX_KEYS = 10_000;

export function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {}
): { ok: boolean; retryAfterSeconds: number } {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  if (buckets.size > MAX_KEYS) buckets.clear();

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - recent[0])) / 1000);
    buckets.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true, retryAfterSeconds: 0 };
}

/** İstemci IP'si — proxy arkasında x-forwarded-for'un ilk parçası. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
