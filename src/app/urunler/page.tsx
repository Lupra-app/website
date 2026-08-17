import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedProjects } from "@/lib/project-data";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ürünler | Lupra",
  description:
    "Lupra'nın belirli operasyonel işler için kurduğu agent'lar — her biri tek bir yükü devralmak için tasarlandı.",
  alternates: { canonical: "https://lupra.app/urunler" },
  openGraph: {
    title: "Lupra Ürünleri",
    description: "Operasyonel işleri devralan agent'lar.",
    url: "https://lupra.app/urunler",
    siteName: "Lupra",
    locale: "tr_TR",
    type: "website",
  },
};

export default async function ProductsPage() {
  const projects = await listPublishedProjects();

  return (
    <div className="min-h-screen bg-bg text-white">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <h1 className="font-heading text-4xl font-semibold text-white md:text-5xl">Ürünler</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Lupra&apos;nın belirli işler için kurduğu agent&apos;lar. Her biri tek bir
          operasyonel yükü devralmak için tasarlandı.
        </p>

        {projects.length === 0 ? (
          <p className="mt-16 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center text-muted">
            Henüz yayınlanmış ürün yok. Yakında burada olacak.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <article key={project.slug}>
                <Link
                  href={`/${project.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-bg-raised/70 transition-all duration-300 hover:border-accent/40 hover:bg-bg-raised"
                >
                  <div className="aspect-16/9 overflow-hidden bg-white/5">
                    {project.cover_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */
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
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-heading text-xl font-semibold leading-snug text-white">
                      {project.title}
                    </h2>
                    {project.summary && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                        {project.summary}
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted/60">
                      Son güncelleme: {formatDate(project.updated_at)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-light">
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
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
