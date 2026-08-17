import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Profil okumaları.
 *
 * SÖZLEŞME: buradaki her fonksiyon `userId` parametresi alır ve o parametre
 * DAİMA `requireUser()`'dan gelen oturumdan geçirilir — istemciden gelen bir
 * kimlik asla buraya ulaşmaz. Çağıranın bu kuralı bozmaması gerekiyor.
 */

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  newsletter_opt_in: boolean;
  created_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id, display_name, avatar_url, bio, newsletter_opt_in, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profil] okunamadı:", error.code, error.message);
    return null;
  }
  return data;
}

export type LinkedIdentity = { provider: string; email: string | null; createdAt: string | null };

/**
 * Kullanıcının bağlı giriş yöntemleri (github, google, email).
 *
 * Auth admin API'sinden okunuyor çünkü identities listesi auth.users'ta
 * duruyor, profiles tablosunda değil.
 */
export async function getLinkedIdentities(userId: string): Promise<LinkedIdentity[]> {
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("[profil] kimlikler okunamadı:", error?.message);
    return [];
  }

  return (data.user.identities ?? []).map((identity) => ({
    provider: identity.provider,
    email: (identity.identity_data?.email as string | undefined) ?? null,
    createdAt: identity.created_at ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Profil ayrıntıları
// ---------------------------------------------------------------------------

export type Order = {
  id: string;
  order_number: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  invoice_url: string | null;
  created_at: string;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  paid: "Ödendi",
  refunded: "İade edildi",
  failed: "Başarısız",
  canceled: "İptal edildi",
};

export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  paid: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  refunded: "border-white/15 bg-white/5 text-muted",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
  canceled: "border-white/15 bg-white/5 text-muted",
};

/** Tutarı kuruştan okunabilir para birimine çevirir. */
export function formatAmount(cents: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export async function getOrders(userId: string, limit?: number): Promise<Order[]> {
  let query = getSupabaseAdmin()
    .from("orders")
    .select(
      "id, order_number, description, amount_cents, currency, status, period_start, period_end, invoice_url, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    // Tablo henüz oluşturulmamışsa profil sayfası çökmesin; bölüm boş görünür.
    console.error("[profil] siparişler okunamadı:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

export type EarlyAccessStatus = {
  status: string;
  created_at: string;
} | null;

/**
 * Kullanıcının erken erişim listesindeki durumu.
 *
 * E-posta üzerinden eşleşiyor: erken erişim kaydı hesap açılmadan önce
 * yapılmış olabilir, dolayısıyla user_id bağlantısı yok.
 */
export async function getEarlyAccessStatus(email: string): Promise<EarlyAccessStatus> {
  const { data, error } = await getSupabaseAdmin()
    .from("early_access")
    .select("status, created_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[profil] erken erişim durumu okunamadı:", error.code, error.message);
    return null;
  }
  return data;
}

export type UserComment = {
  id: string;
  body: string;
  status: string;
  created_at: string;
  posts: { slug: string; title: string } | null;
};

/**
 * Kullanıcının bıraktığı yorumlar.
 *
 * Yorumlar oturum gerektirmediği için user_id ile değil e-posta ile
 * eşleşiyor; kullanıcı yorumu farklı bir adresle bıraktıysa burada görünmez.
 */
export async function getUserComments(email: string): Promise<UserComment[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("comments")
    .select("id, body, status, created_at, posts ( slug, title )")
    .eq("author_email", email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[profil] yorumlar okunamadı:", error.code, error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const rel = (row as Record<string, unknown>).posts;
    return {
      ...(row as unknown as UserComment),
      posts: Array.isArray(rel) ? (rel[0] ?? null) : ((rel as UserComment["posts"]) ?? null),
    };
  });
}
