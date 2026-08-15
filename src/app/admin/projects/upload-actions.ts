"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { ACCEPTED, BUCKET, type MediaKind } from "@/lib/media";

/**
 * Dosya yükleme: tarayıcı DOĞRUDAN Supabase Storage'a yükler.
 *
 * Neden dosya sunucudan geçmiyor: Vercel'de serverless istek gövdesi 4.5 MB
 * ile sınırlı ve disk kalıcı değil — bir video oradan asla geçemez. Bu yüzden
 * sunucu sadece tek kullanımlık, kısa ömürlü bir imzalı yükleme izni üretiyor;
 * baytlar Vercel'e hiç uğramıyor.
 *
 * NOT: Bu dosya "use server" olduğu için yalnızca async fonksiyon export
 * edebilir — sabitler @/lib/media içinde.
 */

export type UploadTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

/** Dosya adını güvenli hale getirir; Türkçe karakterleri sadeleştirir. */
function safeName(name: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return (
    name
      .slice(-120)
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c)
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+/, "") || "dosya"
  );
}

export async function createUploadTicket(
  kind: MediaKind,
  fileName: string,
  contentType: string,
  size: number
): Promise<UploadTicket> {
  await requireAdmin();

  const rules = ACCEPTED[kind];
  if (!rules) return { ok: false, error: "Bilinmeyen dosya türü." };

  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "Dosya boş görünüyor." };
  }
  if (size > rules.maxBytes) {
    return {
      ok: false,
      error: `Dosya çok büyük (${Math.round(size / 1048576)} MB). Sınır: ${Math.round(
        rules.maxBytes / 1048576
      )} MB.`,
    };
  }

  const cleanName = safeName(fileName);
  const isModel = /\.(glb|gltf)$/i.test(cleanName);

  if (kind === "model3d" && !isModel) {
    return { ok: false, error: "3D model dosyası .glb veya .gltf olmalı." };
  }
  if (!rules.mimes.includes(contentType) && !(kind === "model3d" && isModel)) {
    return { ok: false, error: "Bu dosya biçimi desteklenmiyor." };
  }

  const supabase = getSupabaseAdmin();
  const path = `${kind}/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${cleanName}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[upload] imzalı URL üretilemedi:", error?.message);
    return { ok: false, error: "Yükleme başlatılamadı, tekrar dene." };
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, path: data.path, token: data.token, publicUrl: publicData.publicUrl };
}

/** Panelden kaldırılan medyayı depodan da siler. */
export async function deleteUploadedFile(publicUrl: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return { ok: false };

  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([path]);
  if (error) console.error("[upload] dosya silinemedi:", error.message);

  return { ok: !error };
}
