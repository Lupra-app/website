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

/**
 * İstemci IP'si.
 *
 * `x-real-ip` önce deneniyor: onu proxy'nin kendisi yazar. `x-forwarded-for`
 * ise bir listedir ve istemci kendi sahte değerini listenin başına
 * ekleyebilir — ilk parçaya güvenmek, her istekte uydurma bir IP göndererek
 * hız sınırını tamamen atlatmaya izin verirdi. Yedek olarak kullanırken de
 * son parçayı alıyoruz: zincire en son yazan, en yakın (güvenilir) proxy'dir.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const chain = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  return chain[chain.length - 1]?.trim() || "unknown";
}
