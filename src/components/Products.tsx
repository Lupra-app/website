"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import type { ProjectSummary } from "@/lib/project-data";

/**
 * Ana sayfadaki ürün vitrini.
 *
 * İçerik admin panelden yönetilen `projects` kayıtlarından geliyor —
 * burada sabit bir liste yok, yeni bir ürün yayınlandığı an vitrine düşüyor.
 * Hiç yayınlanmış ürün yoksa bölüm ana sayfada hiç render edilmiyor
 * (bkz. page.tsx): boş bir "ürünler" başlığı, ürün olmadığını duyurmaktan
 * başka bir işe yaramaz.
 */
export function Products({ projects }: { projects: ProjectSummary[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-product]", sectionRef.current);

      if (prefersReducedMotion()) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(cards, { opacity: 0, y: 28 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="urunler"
      ref={sectionRef}
      className="relative px-5 py-24 sm:px-8 sm:py-32"
      aria-labelledby="urunler-baslik"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="urunler-baslik"
              className="font-heading text-3xl font-semibold text-white sm:text-4xl"
            >
              Ürünler
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Lupra&apos;nın belirli işler için kurduğu agent&apos;lar. Her biri tek bir
              operasyonel yükü devralmak için tasarlandı.
            </p>
          </div>
          {projects.length > 3 && (
            <Link
              href="/urunler"
              data-cursor-hover
              className="text-sm font-semibold text-accent-light transition-colors hover:text-white"
            >
              Tümünü gör →
            </Link>
          )}
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <article key={project.slug} data-product>
              <Link
                href={`/${project.slug}`}
                data-cursor-hover
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-bg-raised/70 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-bg-raised"
              >
                <div className="relative aspect-16/9 overflow-hidden bg-white/5">
                  {project.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- Supabase
                       Storage'dan geliyor; next/image remotePatterns gerektirir. */
                    <img
                      src={project.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-transparent">
                      <span aria-hidden="true" className="font-heading text-3xl text-white/25">
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Görselin altını karartıp başlığın okunurluğunu garantiler. */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-raised/90 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-xl font-semibold leading-snug text-white">
                    {project.title}
                  </h3>
                  {project.summary && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {project.summary}
                    </p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-light">
                    Detayına bak
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
