import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { parseUserAgent } from "@/lib/user-agent";

/** İstemciden gelen her metin alanı için üst sınır. */
const MAX_FIELD = 300;

/**
 * İstemcinin gönderdiği alanlar TAMAMEN güvenilmez: bunlar tarayıcıda üretiliyor
 * ve elle değiştirilebiliyor. Sadece kırpılıp saklanıyorlar, hiçbir karar
 * bunlara dayanmıyor.
 */
function field(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_FIELD);
  return trimmed || null;
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`early-access:${clientIp(request)}`);
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const email = normalizeEmail(payload.email);

  if (!isValidEmail(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const attribution = (payload.attribution ?? {}) as Record<string, unknown>;

  // Cihaz/tarayıcı/işletim sistemi istek başlığından türetiliyor, istemcinin
  // beyanından değil. Ham user-agent saklanmıyor — parmak izi çıkarmaya
  // yetecek kadar ayırt edici.
  const { deviceType, browser, os } = parseUserAgent(request.headers.get("user-agent"));

  // Ülke: Vercel her isteğe bu başlığı ekliyor. IP'nin kendisi hiçbir yere
  // yazılmıyor (yalnızca bellekteki hız sınırı anahtarında kullanılıyor).
  // Yerelde bu başlık yok, o yüzden null kalır.
  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");

  try {
    const supabase = getSupabaseAdmin();

    let { error } = await supabase.from("early_access").insert({
      email,
      source_referrer: field(attribution.referrer),
      utm_source: field(attribution.utmSource),
      utm_medium: field(attribution.utmMedium),
      utm_campaign: field(attribution.utmCampaign),
      language: field(attribution.language),
      device_type: deviceType,
      browser,
      os,
      country: country ? country.slice(0, 2).toUpperCase() : null,
    });

    // Kolon yok, yani şema migration'ı henüz çalıştırılmamış. İki koda da
    // bakılıyor: PostgREST isteği kendi şema önbelleğinde durdurursa PGRST204,
    // Postgres'e kadar giderse 42703 döner.
    //
    // Bu durumda ziyaretçinin kaydını KAYBETMEK en kötü sonuç olur — bağlam
    // alanlarını bırakıp yalnızca e-postayı yazıyoruz. Kod canlıya SQL'den
    // önce çıkarsa form çalışmaya devam eder, sadece ayrıntılar boş kalır.
    if (error?.code === "PGRST204" || error?.code === "42703") {
      console.warn(
        "early_access: bağlam kolonları yok, yalnızca e-posta kaydedildi. " +
          "supabase/schema.sql çalıştırılmalı."
      );
      ({ error } = await supabase.from("early_access").insert({ email }));
    }

    // Unique violation (already signed up) is not a failure from the
    // visitor's point of view — they're on the list either way.
    if (error && error.code !== "23505") {
      console.error("early_access insert failed:", error.code, error.message);
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  } catch (err) {
    console.error("early_access insert failed:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
