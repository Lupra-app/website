import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isValidEmail, normalizeEmail, UUID_RE } from "@/lib/validation";

const MIN_NAME = 2;
const MAX_NAME = 80;
const MIN_BODY = 5;
const MAX_BODY = 2000;

/**
 * Ziyaretçi yorumu alır.
 *
 * Her yorum 'pending' olarak kaydedilir ve panelden onaylanmadan sitede
 * GÖRÜNMEZ — girişsiz yorum kaçınılmaz olarak spam çeker. Yanıt her durumda
 * aynı: "alındı". Onaylanıp onaylanmadığını göndericiye söylemiyoruz, yoksa
 * spam gönderen filtreyi kalibre edebilir.
 *
 * IP saklanmıyor; erken erişimdeki kararla aynı şekilde yalnızca ülke kodu.
 */
export async function POST(request: Request) {
  // Yorum, e-posta kaydından daha sık meşru tekrar eder (aynı kişi birden
  // fazla yazıya yorum yazabilir), o yüzden pencere daha geniş.
  const limit = checkRateLimit(`comments:${clientIp(request)}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
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
  // postId yoksa yorum site geneline (ana sayfaya) bırakılmış demektir.
  const rawPostId = String(payload.postId ?? "").trim();
  const postId = rawPostId || null;
  const name = String(payload.name ?? "").trim().slice(0, MAX_NAME);
  const text = String(payload.body ?? "").trim().slice(0, MAX_BODY);
  const email = normalizeEmail(payload.email);

  if (postId && !UUID_RE.test(postId)) {
    return Response.json({ error: "invalid_post" }, { status: 400 });
  }
  if (name.length < MIN_NAME) return Response.json({ error: "invalid_name" }, { status: 400 });
  if (text.length < MIN_BODY) return Response.json({ error: "invalid_body" }, { status: 400 });
  // E-posta opsiyonel; verildiyse geçerli olmalı.
  if (email && !isValidEmail(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");

  try {
    const supabase = getSupabaseAdmin();

    // Bir yazıya yorum yazılıyorsa o yazının var ve YAYINDA olduğunu doğrula:
    // yayınlanmamış ya da uydurma bir id'ye yorum yazılmasını engelliyor.
    // Site geneli yorumlarda (postId null) böyle bir hedef yok.
    if (postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("id")
        .eq("id", postId)
        .eq("status", "published")
        .maybeSingle();

      if (!post) return Response.json({ error: "invalid_post" }, { status: 400 });
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_name: name,
      author_email: email || null,
      body: text,
      status: "pending",
      country: country ? country.slice(0, 2).toUpperCase() : null,
    });

    if (error) {
      // 23502 = not-null ihlali. Site geneli yorumlar post_id'nin NULL
      // olabilmesini gerektiriyor; şema güncellenmemişse tam olarak buraya
      // düşer ve sebebi ham hata mesajından anlaşılmaz.
      if (error.code === "23502" && !postId) {
        console.error(
          "comment insert failed: comments.post_id hâlâ NOT NULL. Ana sayfa " +
            "fikir duvarı için şu SQL çalıştırılmalı: " +
            "alter table comments alter column post_id drop not null;"
        );
      } else {
        console.error("comment insert failed:", error.code, error.message);
      }
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  } catch (err) {
    console.error("comment insert failed:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
