"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/blog-data";

/**
 * Ana sayfadaki blog bölümü — en son yayınlanan yazılar.
 *
 * Ürün vitrini gibi, hiç yayınlanmış yazı yoksa bölüm hiç render edilmiyor
 * (bkz. page.tsx). Ana sayfada boş bir blog başlığı, siteyi terk edilmiş
 * gösterir.
 */
export function LatestPosts({ posts }: { posts: PostSummary[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-post]", sectionRef.current);

      if (prefersReducedMotion()) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(cards, { opacity: 0, y: 24 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="relative px-5 py-24 sm:px-8 sm:py-32"
      aria-labelledby="blog-baslik"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="blog-baslik"
              className="font-heading text-3xl font-semibold text-white sm:text-4xl"
            >
              Blog&apos;dan
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Operasyonel işleri agent&apos;lara devretmek üzerine notlar — neyin işe
              yaradığı, neyin yaramadığı ve nedenleri.
            </p>
          </div>
          <Link
            href="/blog"
            data-cursor-hover
            className="text-sm font-semibold text-accent-light transition-colors hover:text-white"
          >
            Tüm yazılar →
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} data-post>
              <Link
                href={`/blog/${post.slug}`}
                data-cursor-hover
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-bg-raised/70 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-bg-raised"
              >
                {post.cover_url && (
                  <div className="aspect-16/9 overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */}
                    <img
                      src={post.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted/70">
                    {post.published_at && (
                      <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                    )}
                    {post.reading_minutes && <span>· {post.reading_minutes} dk</span>}
                  </div>

                  <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-white">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                  )}

                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
