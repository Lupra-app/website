"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { formatDate } from "@/lib/format";
import type { PublicComment } from "@/lib/blog-data";

/**
 * Ana sayfadaki fikir duvarı.
 *
 * Blog yorumlarıyla aynı tabloyu ve aynı moderasyon kuyruğunu kullanıyor;
 * farkı `post_id`'nin boş olması. Gönderilen yorum ANINDA GÖRÜNMEZ, onaydan
 * geçer — bunu kullanıcıya açıkça söylüyoruz, yoksa kaybolduğunu sanıp
 * tekrar tekrar gönderiyor.
 */
export function IdeaWall({ comments }: { comments: PublicComment[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-idea]", sectionRef.current);
      gsap.set(items, { opacity: 0, y: 20 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
    },
    { scope: sectionRef }
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBody = body.trim();

    if (trimmedName.length < 2) return setError("Adını yazar mısın?");
    if (trimmedBody.length < 5) return setError("Fikrin biraz daha uzun olmalı.");

    setSending(true);
    setError(null);
    try {
      // postId gönderilmiyor: bu yorum site geneline ait.
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: email.trim(), body: trimmedBody }),
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
    <section
      id="fikirler"
      ref={sectionRef}
      className="relative px-5 py-24 sm:px-8 sm:py-32"
      aria-labelledby="fikirler-baslik"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="fikirler-baslik"
          className="font-heading text-3xl font-semibold text-white sm:text-4xl"
        >
          Fikir duvarı
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Lupra&apos;dan ne beklediğini, hangi işini devretmek istediğini yaz. Okuyoruz ve
          yol haritasını buna göre şekillendiriyoruz.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            {comments.length === 0 ? (
              <p
                data-idea
                className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-muted"
              >
                Henüz fikir paylaşılmadı. İlkini sen yaz.
              </p>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    data-idea
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-medium text-white">{comment.author_name}</span>
                      <time dateTime={comment.created_at} className="text-xs text-muted/70">
                        {formatDate(comment.created_at)}
                      </time>
                    </div>
                    {/* Ziyaretçi metni düz basılıyor: markdown/HTML render etmek
                        XSS yüzeyi açardı. */}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {comment.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div data-idea className="rounded-2xl border border-white/10 bg-bg-raised/60 p-6">
            <h3 className="font-heading text-lg font-semibold text-white">Fikrini bırak</h3>
            <p className="mt-1 text-sm text-muted">
              Yorumlar yayınlanmadan önce okunuyor, o yüzden hemen görünmeyebilir.
            </p>

            {sent ? (
              <p
                role="status"
                className="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                Teşekkürler! Fikrin bize ulaştı, onaylandıktan sonra burada görünecek.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Fikrin</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    required
                    placeholder="Hangi işini bir agent'a devretmek isterdin?"
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
                  data-cursor-hover
                  className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Gönderiliyor…" : "Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
