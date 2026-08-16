"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { BlockEditor } from "@/app/admin/projects/components/BlockEditor";
import { MediaUploader } from "@/app/admin/projects/components/MediaUploader";
import { savePost } from "../actions";
import { EMPTY_POST_STATE, POST_ERRORS } from "../form-state";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  tags: string[];
  blocks: Block[];
  project_id: string | null;
  status: string;
};

export function PostForm({
  post,
  projects,
}: {
  post?: Post;
  projects: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(savePost, EMPTY_POST_STATE);
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
  const isEdit = Boolean(post);
  const message = state.error ? (POST_ERRORS[state.error] ?? POST_ERRORS.server_error) : null;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  // Input'lar uncontrolled (defaultValue) ve formda değişen bir key yok:
  // hatada bileşen remount olmadığı için yazılanlar kaybolmuyor.
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

      {isEdit && <input type="hidden" name="id" value={post!.id} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">Başlık</span>
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={post?.title ?? ""}
            placeholder="WhatsApp'tan gelen talepleri kaybetmeyi nasıl bıraktık"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            Slug <span className="text-muted/60">— lupra.app/blog/&lt;slug&gt;</span>
          </span>
          <input
            name="slug"
            required
            maxLength={90}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={post?.slug ?? ""}
            placeholder="whatsapp-talep-takibi"
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-muted">
          Özet{" "}
          <span className="text-muted/60">
            — arama sonucunda ve blog kartında görünür, doğrudan cevabı ver
          </span>
        </span>
        <textarea
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={post?.excerpt ?? ""}
          placeholder="Emlak ofislerine WhatsApp'tan gelen taleplerin yarısı elle takip edildiği için kayboluyor. Lupra bunları otomatik yakalıyor ve tek listede topluyor."
          className={`${inputClass} resize-y`}
        />
      </label>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            Etiketler <span className="text-muted/60">— virgülle ayır, en fazla 6</span>
          </span>
          <input
            name="tags"
            defaultValue={post?.tags?.join(", ") ?? ""}
            placeholder="otomasyon, whatsapp, emlak"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            İlgili proje <span className="text-muted/60">— opsiyonel</span>
          </span>
          <select
            name="project_id"
            defaultValue={post?.project_id ?? ""}
            className="w-full rounded-lg border border-white/10 bg-bg-raised px-4 py-3 text-sm text-white focus:border-accent focus:outline-none"
          >
            <option value="">Yok</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <input type="hidden" name="cover_url" value={coverUrl} />
        <MediaUploader
          kind="image"
          value={coverUrl}
          onChange={setCoverUrl}
          label="Kapak görseli — blog kartında ve sosyal medya önizlemesinde kullanılır"
        />
      </div>

      <div className="border-t border-white/10 pt-6">
        <BlockEditor name="blocks" initial={post?.blocks ?? []} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <div>
          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted">Durum</span>
            <select
              name="status"
              defaultValue={post?.status ?? "draft"}
              className="rounded-lg border border-white/10 bg-bg-raised px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
            </select>
          </label>
          <p className="mt-2 text-xs text-muted/70">
            Taslaklar blogda listelenmez ve adresleri 404 döner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
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
