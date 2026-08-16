"use client";

import { useState, type FormEvent } from "react";
import type { PublicComment } from "@/lib/blog-data";
import { formatDate } from "@/lib/format";

/**
 * Yorum listesi + yeni yorum formu.
 *
 * Gönderilen yorum ANINDA GÖRÜNMEZ: onay kuyruğuna düşer. Bunu kullanıcıya
 * açıkça söylüyoruz — yoksa yorumu kaybolmuş sanıp tekrar tekrar gönderiyor.
 */
export function CommentSection({
  postId,
  comments,
}: {
  postId: string;
  comments: PublicComment[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBody = body.trim();

    if (trimmedName.length < 2) return setError("Adını yazar mısın?");
    if (trimmedBody.length < 5) return setError("Yorum biraz daha uzun olmalı.");

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          name: trimmedName,
          email: email.trim(),
          body: trimmedBody,
        }),
      });

      if (res.status === 429) {
        setError("Çok hızlı gönderdin, birkaç dakika sonra tekrar dene.");
        return;
      }
      if (!res.ok) throw new Error("failed");

      setSent(true);
      setName("");
      setEmail("");
      setBody("");
    } catch {
      setError("Gönderilemedi, birazdan tekrar dene.");
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <section aria-labelledby="yorumlar" className="border-t border-white/10 pt-12">
      <h2 id="yorumlar" className="font-heading text-2xl font-semibold text-white">
        Yorumlar {comments.length > 0 && <span className="text-muted">({comments.length})</span>}
      </h2>

      {comments.length > 0 ? (
        <ul className="mt-8 space-y-5">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium text-white">{comment.author_name}</span>
                <time dateTime={comment.created_at} className="text-xs text-muted/70">
                  {formatDate(comment.created_at)}
                </time>
              </div>
              {/* Düz metin olarak basılıyor: ziyaretçi girdisinde markdown veya
                  HTML render etmek XSS yüzeyi açar. */}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted">
          Henüz yorum yok. İlk fikri sen bırak.
        </p>
      )}

      <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="font-heading text-lg font-semibold text-white">Fikrini yaz</h3>
        <p className="mt-1 text-sm text-muted">
          Yorumlar yayınlanmadan önce okunuyor, o yüzden hemen görünmeyebilir.
        </p>

        {sent ? (
          <p
            role="status"
            className="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            Teşekkürler! Yorumun bize ulaştı, onaylandıktan sonra burada görünecek.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Adın</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  E-posta <span className="text-muted/60">— opsiyonel, yayınlanmaz</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Yorumun</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={2000}
                required
                className={`${inputClass} resize-y`}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Gönderiliyor…" : "Gönder"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
