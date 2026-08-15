"use client";

import { useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ACCEPTED, BUCKET, formatBytes, type MediaKind } from "@/lib/media";
import { createUploadTicket } from "../upload-actions";

/**
 * Dosyayı tarayıcıdan doğrudan Supabase Storage'a yükler.
 *
 * Akış: sunucudan imzalı yükleme izni al → dosyayı Storage'a gönder →
 * public URL'i çağırana bildir. Dosya baytları uygulama sunucusuna hiç
 * uğramaz, bu yüzden Vercel'in 4.5 MB istek gövdesi sınırı devreye girmez.
 */
export function MediaUploader({
  kind,
  value,
  onChange,
  label,
}: {
  kind: MediaKind;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const rules = ACCEPTED[kind];

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setProgress(`${file.name} · ${formatBytes(file.size)} yükleniyor…`);

    try {
      if (file.size > rules.maxBytes) {
        setError(
          `Dosya çok büyük (${formatBytes(file.size)}). Sınır: ${formatBytes(rules.maxBytes)}.`
        );
        return;
      }

      const ticket = await createUploadTicket(kind, file.name, file.type, file.size);
      if (!ticket.ok) {
        setError(ticket.error);
        return;
      }

      const { error: uploadError } = await getSupabaseBrowser()
        .storage.from(BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        setError(`Yüklenemedi: ${uploadError.message}`);
        return;
      }

      onChange(ticket.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && <span className="mb-2 block text-xs font-medium text-muted">{label}</span>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) handleFile(file);
        }}
        className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center transition-colors hover:border-white/35"
      >
        <input
          ref={inputRef}
          type="file"
          accept={rules.accept}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 disabled:opacity-50"
        />
        <p className="mt-2 text-xs text-muted/60">
          {busy ? (progress ?? "Yükleniyor…") : `Sürükleyip bırakabilirsin · ${rules.label}`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {value && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <MediaThumb kind={kind} url={value} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-muted">{value.split("/").pop()}</p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-1 text-xs font-semibold text-red-300 transition-colors hover:text-red-200"
            >
              Kaldır
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaThumb({ kind, url }: { kind: MediaKind; url: string }) {
  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element -- Storage'daki
    // rastgele kaynaklar için next/image'in remotePatterns yapılandırması
    // gerekir; bu yalnızca panel içi küçük bir önizleme.
    return <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />;
  }
  if (kind === "video") {
    return <video src={url} className="h-14 w-14 rounded-lg object-cover" muted playsInline />;
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-2xl">
      🧊
    </div>
  );
}
