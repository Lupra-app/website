/**
 * Medya yükleme sabitleri.
 *
 * upload-actions.ts bir `"use server"` dosyası ve oradan yalnızca async
 * fonksiyon export edilebiliyor — bu yüzden sabitler burada duruyor ve
 * hem sunucu hem istemci tarafından paylaşılıyor.
 */

export const BUCKET = "project-media";

/** Supabase ücretsiz planında dosya başına izin verilen üst sınır. */
export const BUCKET_FILE_LIMIT = 50 * 1024 * 1024;

export type MediaKind = "image" | "video" | "model3d";

export const ACCEPTED: Record<
  MediaKind,
  { accept: string; mimes: string[]; maxBytes: number; label: string }
> = {
  image: {
    accept: "image/jpeg,image/png,image/webp,image/avif,image/gif",
    mimes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
    maxBytes: 10 * 1024 * 1024,
    label: "JPG, PNG, WebP, AVIF veya GIF · en fazla 10 MB",
  },
  video: {
    accept: "video/mp4,video/webm,video/quicktime",
    mimes: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: BUCKET_FILE_LIMIT,
    label: "MP4 veya WebM · en fazla 50 MB",
  },
  model3d: {
    // .glb dosyaları tarayıcıda çoğu zaman boş ya da application/octet-stream
    // MIME'ıyla gelir, bu yüzden uzantı kontrolü de yapılıyor.
    accept: ".glb,.gltf,model/gltf-binary,model/gltf+json",
    mimes: ["model/gltf-binary", "model/gltf+json", "application/octet-stream", ""],
    maxBytes: 25 * 1024 * 1024,
    label: "GLB veya GLTF · en fazla 25 MB",
  },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
