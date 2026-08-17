"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { emailSiteOrigin } from "@/lib/site-url";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireUser } from "@/lib/dal";
import { isValidEmail, normalizeEmail, safeHttpUrl } from "@/lib/validation";
import { mapSupabaseAuthError } from "@/app/(auth)/auth-state";
import type { ProfileFormState } from "./profile-state";

/**
 * Profil ayarları.
 *
 * GÜVENLİK KURALI: hiçbir action istemciden gelen kullanıcı kimliğini kabul
 * etmiyor. Hangi kaydın güncelleneceği her zaman `requireUser()`'dan dönen
 * oturumdan geliyor — böylece bir kullanıcı başkasının profilini düzenleyecek
 * bir istek uyduramaz.
 */

const MAX_NAME = 60;
const MAX_BIO = 300;
const MIN_PASSWORD = 8;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await requireUser();

  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, MAX_NAME);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, MAX_BIO);
  // Bu değer <img src> olarak basılıyor; şema doğrulanmadan saklanmıyor.
  // Şemasız/bozuk bir değer boşa düşer ve avatar baş harf rozetine geri döner.
  const avatarUrl = safeHttpUrl(formData.get("avatar_url"));
  const newsletter = formData.get("newsletter") === "on";

  const { error } = await getSupabaseAdmin()
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      newsletter_opt_in: newsletter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId); // <- oturumdan, istemciden değil

  if (error) {
    console.error("[profil] güncellenemedi:", error.code, error.message);
    return { error: "server_error", info: null };
  }

  revalidatePath("/profil");
  revalidatePath("/profil/ayarlar");
  return { error: null, info: "Profilin güncellendi." };
}

/** Şifre belirleme/değiştirme. OAuth ile gelen kullanıcının şifresi olmayabilir. */
export async function updatePassword(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  await requireUser();

  const password = String(formData.get("password") ?? "");
  const passwordAgain = String(formData.get("password_again") ?? "");

  if (password.length < MIN_PASSWORD) return { error: "weak_password", info: null };
  if (password !== passwordAgain) return { error: "password_mismatch", info: null };

  // Kullanıcının kendi oturumuyla: Supabase Auth şifre kurallarını ve hız
  // sınırını burada uyguluyor.
  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: mapSupabaseAuthError(error.message, error.status), info: null };
  }
  return { error: null, info: "Şifren güncellendi." };
}

/** E-posta değişikliği — yeni adrese doğrulama maili gider. */
export async function updateEmail(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  await requireUser();

  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { error: "invalid_email", info: null };

  const origin = await emailSiteOrigin();

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/callback?next=%2Fprofil%2Fayarlar` }
  );

  if (error) {
    return { error: mapSupabaseAuthError(error.message, error.status), info: null };
  }
  return {
    error: null,
    info: "Yeni adresine bir doğrulama bağlantısı gönderdik. Tıklayana kadar eski adresin geçerli.",
  };
}

/**
 * Hesabı tamamen siler.
 *
 * Silme service-role gerektiriyor ama hangi kullanıcının silineceği YİNE
 * oturumdan geliyor. Ek olarak kullanıcının e-postasını yazarak onaylaması
 * isteniyor — geri alınamaz bir işlem için tek tıkla yeterli değil.
 */
export async function deleteAccount(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await requireUser();

  const confirmation = normalizeEmail(formData.get("confirm_email"));
  if (confirmation !== session.email) {
    return { error: "confirmation_mismatch", info: null };
  }

  // Yöneticiler kendi hesaplarını buradan silemez: allowlist'te satırı kalır
  // ve panel erişimi kopar. Yönetici çıkarma işlemi /admin/admins'te.
  if (session.isAdmin) {
    return { error: "admin_cannot_delete", info: null };
  }

  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();

  // profiles satırı auth.users'a foreign key ile bağlı (on delete cascade),
  // yani kullanıcı silinince profili de gider.
  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(session.userId);
  if (error) {
    console.error("[profil] hesap silinemedi:", error.message);
    return { error: "server_error", info: null };
  }

  redirect("/?hesap=silindi");
}
