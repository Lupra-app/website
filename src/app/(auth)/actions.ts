"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import {
  MIN_PASSWORD,
  mapSupabaseAuthError,
  safeNext,
  type AuthFormState,
} from "./auth-state";

/**
 * Kimlik doğrulama server action'ları.
 *
 * Hepsi kullanıcı oturumunu çerezlere yazan `getSupabaseServer()` istemcisini
 * kullanıyor (service-role DEĞİL): oturum açan kişi kullanıcının kendisi, ve
 * Supabase Auth'un şifre doğrulama, hız sınırı ve e-posta akışları bu yoldan
 * geçiyor.
 */

/** Doğrulama ve şifre sıfırlama maillerinin döneceği mutlak adres. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const passwordAgain = String(formData.get("password_again") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!isValidEmail(email)) return { error: "invalid_email", emailSent: null, info: null };
  if (password.length < MIN_PASSWORD) {
    return { error: "weak_password", emailSent: null, info: null };
  }
  if (password !== passwordAgain) {
    return { error: "password_mismatch", emailSent: null, info: null };
  }

  const supabase = await getSupabaseServer();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message, error.status), emailSent: null, info: null };
  }

  // E-posta doğrulaması açık olduğu için signUp oturum AÇMIYOR; kullanıcı
  // postasındaki bağlantıya tıklamalı. Oturum yine de gelirse (ayar sonradan
  // değişirse) doğrudan içeri al.
  if (data.session) redirect(next);

  return { error: null, emailSent: email, info: null };
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!isValidEmail(email) || !password) {
    return { error: "invalid_credentials", emailSent: null, info: null };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapSupabaseAuthError(error.message, error.status), emailSent: null, info: null };
  }

  redirect(next);
}

/** Doğrulama mailini yeniden gönderir. */
export async function resendConfirmation(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { error: "invalid_email", emailSent: null, info: null };

  const supabase = await getSupabaseServer();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message, error.status), emailSent: null, info: null };
  }
  return { error: null, emailSent: email, info: "Doğrulama e-postası yeniden gönderildi." };
}

/**
 * Şifre sıfırlama maili gönderir.
 *
 * Adres kayıtlı olmasa bile AYNI yanıt dönüyor: "kayıtlı değil" demek,
 * saldırgana hangi e-postaların sistemde olduğunu doğrulatır.
 */
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { error: "invalid_email", emailSent: null, info: null };

  const supabase = await getSupabaseServer();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/profil/sifre-yenile")}`,
  });

  if (error && error.status === 429) {
    return { error: "rate_limited", emailSent: null, info: null };
  }

  return {
    error: null,
    emailSent: email,
    info: "Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
  };
}
