"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/dal";
import { BUCKET } from "@/lib/media";

/**
 * Avatar yükleme izni.
 *
 * Projelerdeki `createUploadTicket` YÖNETİCİ gerektiriyor; normal kullanıcı
 * onu kullanamaz. Bu, kullanıcı seviyesindeki karşılığı ve kasıtlı olarak çok
 * daha dar: yalnızca görsel, 2 MB sınırı ve dosya kullanıcının kendi
 * klasörüne yazılıyor (avatars/<kullanıcı-id>/...), böylece bir kullanıcı
 * başkasının dosyasının üzerine yazamıyor.
 */

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type AvatarTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

export async function createAvatarUploadTicket(
  contentType: string,
  size: number
): Promise<AvatarTicket> {
  const session = await requireUser();

  if (!ALLOWED.includes(contentType)) {
    return { ok: false, error: "Yalnızca JPG, PNG, WebP veya AVIF yükleyebilirsin." };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "Dosya boş görünüyor." };
  }
  if (size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Avatar en fazla 2 MB olabilir." };
  }

  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  // Yol kullanıcının oturumundaki kimlikten kuruluyor, istemciden değil.
  const path = `avatars/${session.userId}/${Date.now().toString(36)}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[avatar] imzalı URL üretilemedi:", error?.message);
    return { ok: false, error: "Yükleme başlatılamadı, tekrar dene." };
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, path: data.path, token: data.token, publicUrl: publicData.publicUrl };
}
