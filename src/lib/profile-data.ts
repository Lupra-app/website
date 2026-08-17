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
