import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Logo } from "@/components/Logo";
import { BlockRenderer } from "@/components/BlockRenderer";
import { blocksToPlainText, parseBlocks } from "@/lib/blocks";
import { formatDate } from "@/lib/format";

// Yayınlanmış proje sayfası: lupra.app/<slug>. İçerik admin panelden
// (/admin/projects) bloklarla kuruluyor. Statik route'lar (login, admin, ...)
// bu dinamik segmentten her zaman önce eşleşir.
//
// cache(): sayfa ve generateMetadata aynı projeyi istiyor; memoize edilmezse
// her istekte iki ayrı sorgu giderdi.
const fetchPublishedProject = cache(async (slug: string) => {
  try {
    const { data } = await getSupabaseAdmin()
      .from("projects")
      .select("slug, title, summary, content, cover_url, blocks, updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!data) return null;
    return { ...data, blocks: parseBlocks(data.blocks) };
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchPublishedProject(slug);
  if (!project) return {};

  const description = project.summary ?? blocksToPlainText(project.blocks) ?? undefined;

  return {
    title: `${project.title} | Lupra`,
    description,
    alternates: { canonical: `https://lupra.app/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      url: `https://lupra.app/${project.slug}`,
      siteName: "Lupra",
      locale: "tr_TR",
      type: "article",
      images: project.cover_url ? [{ url: project.cover_url }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await fetchPublishedProject(slug);
  if (!project) notFound();

  const hasBlocks = project.blocks.length > 0;

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Lupra ana sayfa">
            <Logo />
          </Link>
          <Link
            href="/#early-access"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Erken erişim
          </Link>
        </div>
      </header>

      <main className="pb-24">
        {/* Kapak */}
        <div className="relative overflow-hidden border-b border-white/10">
          {project.cover_url && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase
                  Storage'dan geliyor; next/image remotePatterns gerektirir. */}
              <img
                src={project.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
            </>
          )}
          <div className="relative mx-auto max-w-3xl px-6 py-20 md:py-28">
            <h1 className="font-heading text-4xl font-semibold leading-tight text-white md:text-5xl">
              {project.title}
            </h1>
            {project.summary && (
              <p className="mt-5 text-lg leading-relaxed text-muted">{project.summary}</p>
            )}
            <p className="mt-6 text-xs text-muted/60">
              Son güncelleme: {formatDate(project.updated_at)}
            </p>
          </div>
        </div>

        <article className="pt-16 md:pt-20">
          {hasBlocks ? (
            <BlockRenderer blocks={project.blocks} />
          ) : (
            // Bloklardan önce markdown ile yazılmış projeler için yedek yol.
            <div className="mx-auto max-w-3xl px-6">
              <div className="prose-lupra">
                <ReactMarkdown>{project.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span>© {new Date().getFullYear()} Lupra</span>
          <Link href="/" className="transition-colors hover:text-white">
            lupra.app
          </Link>
        </div>
      </footer>
    </div>
  );
}
