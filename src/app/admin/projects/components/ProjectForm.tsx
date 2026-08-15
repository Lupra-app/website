"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProject, EMPTY_PROJECT_STATE } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_title: "Başlık boş olamaz (en fazla 140 karakter).",
  invalid_slug: "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. whatsapp-agent).",
  reserved_slug: "Bu slug sistem tarafından kullanılıyor, başka bir tane seç.",
  slug_taken: "Bu slug'a sahip bir proje zaten var.",
  invalid_summary: "Özet en fazla 300 karakter olabilir.",
  content_too_long: "İçerik çok uzun (100.000 karakter sınırı).",
  not_found: "Bu proje bulunamadı — başka bir sekmede silinmiş olabilir.",
  server_error: "Sunucu hatası — kayıt yapılamadı, tekrar dene.",
};

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  status: string;
};

export function ProjectForm({ project }: { project?: Project }) {
  const [state, formAction, pending] = useActionState(saveProject, EMPTY_PROJECT_STATE);
  const isEdit = Boolean(project);
  const message = state.error ? (ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error) : null;

  // NOT: input'lar kasıtlı olarak uncontrolled (defaultValue) ve forma değişen
  // bir key prop'u verilmiyor. Hata durumunda bileşen remount olmadığı için
  // kullanıcının yazdıkları DOM'da olduğu gibi kalır.
  return (
    <form action={formAction} className="space-y-6">
      {message && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {message}
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={project!.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">Başlık</span>
          <input
            name="title"
            required
            maxLength={140}
            defaultValue={project?.title ?? ""}
            placeholder="WhatsApp Talep Yakalama Agent'ı"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            Slug <span className="text-muted/60">— lupra.app/&lt;slug&gt;</span>
          </span>
          <input
            name="slug"
            required
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={project?.slug ?? ""}
            placeholder="whatsapp-agent"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-muted">
          Özet <span className="text-muted/60">— kart ve SEO açıklaması, opsiyonel</span>
        </span>
        <input
          name="summary"
          maxLength={300}
          defaultValue={project?.summary ?? ""}
          placeholder="Emlak ofisleri için WhatsApp üzerinden gelen talepleri yakalayan agent."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-muted">
          İçerik <span className="text-muted/60">— markdown</span>
        </span>
        <textarea
          name="content"
          rows={16}
          defaultValue={project?.content ?? ""}
          placeholder={
            "## Sorun\n\nEmlak ofislerine WhatsApp'tan gelen talepler kayboluyor...\n\n## Çözüm\n\n- Talep yakalama\n- Otomatik yanıt"
          }
          className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm leading-relaxed text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted">Durum</span>
          <select
            name="status"
            defaultValue={project?.status ?? "draft"}
            className="rounded-lg border border-white/10 bg-bg-raised px-3 py-2 text-sm text-white transition-colors focus:border-accent focus:outline-none"
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
          </select>
        </label>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            Vazgeç
          </Link>
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : isEdit ? "Kaydet" : "Oluştur"}
          </button>
        </div>
      </div>
    </form>
  );
}
