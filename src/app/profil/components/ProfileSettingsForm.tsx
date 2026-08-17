"use client";

import { useActionState, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { BUCKET } from "@/lib/media";
import { updateProfile } from "../actions";
import { createAvatarUploadTicket } from "../upload-actions";
import { EMPTY_PROFILE_STATE, profileError } from "../profile-state";
import type { Profile } from "@/lib/profile-data";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function ProfileSettingsForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY_PROFILE_STATE);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Avatar doğrudan Storage'a yükleniyor; sunucu yalnızca kısa ömürlü bir
   * imzalı izin üretiyor. Dosya yolu oturumdaki kullanıcı kimliğinden
   * kuruluyor, bu yüzden başkasının dosyasının üzerine yazmak mümkün değil.
   */
  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const ticket = await createAvatarUploadTicket(file.type, file.size);
      if (!ticket.ok) {
        setUploadError(ticket.error);
        return;
      }

      const { error } = await getSupabaseBrowser()
        .storage.from(BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });

      if (error) {
        setUploadError(`Yüklenemedi: ${error.message}`);
        return;
      }
      setAvatarUrl(ticket.publicUrl);
    } catch {
      setUploadError("Beklenmeyen bir hata oluştu.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="flex flex-wrap items-center gap-4">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl text-muted">
            ?
          </span>
        )}

        <div className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Avatar <span className="text-muted/60">— JPG, PNG, WebP · en fazla 2 MB</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 disabled:opacity-50"
          />
          {uploading && <p className="mt-1 text-xs text-muted">Yükleniyor…</p>}
          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="mt-1 text-xs font-semibold text-red-300 hover:text-red-200"
            >
              Avatarı kaldır
            </button>
          )}
          {uploadError && (
            <p role="alert" className="mt-1 text-xs text-red-300">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Görünen ad</span>
        <input
          name="display_name"
          maxLength={60}
          defaultValue={profile?.display_name ?? ""}
          placeholder="Adın veya kullandığın isim"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">
          Hakkında <span className="text-muted/60">— en fazla 300 karakter</span>
        </span>
        <textarea
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={profile?.bio ?? ""}
          className={`${inputClass} resize-y`}
        />
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={profile?.newsletter_opt_in ?? false}
          className="mt-0.5 rounded border-white/20 bg-white/10"
        />
        <span className="text-muted">
          Lupra&apos;dan gelişme e-postaları almak istiyorum.
          <span className="block text-xs text-muted/60">İstediğin zaman kapatabilirsin.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          aria-busy={pending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {state.info && (
          <span role="status" className="text-sm text-emerald-300">
            {state.info}
          </span>
        )}
        {state.error && (
          <span role="alert" className="text-sm text-red-300">
            {profileError(state.error)}
          </span>
        )}
      </div>
    </form>
  );
}
