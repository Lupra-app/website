import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Logo } from "@/components/Logo";

// Yayınlanmış proje sayfası: lupra.app/<slug>. İçerik admin panelden
// (CMS, /admin/projects) markdown olarak yönetilir. Statik route'lar
// (login, admin, ...) bu dinamik segmentten her zaman önce eşleşir.

async function fetchPublishedProject(slug: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("projects")
      .select("slug, title, summary, content, updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchPublishedProject(slug);
  if (!project) return {};

  return {
    title: `${project.title} | Lupra`,
    description: project.summary ?? undefined,
    alternates: { canonical: `https://lupra.app/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary ?? undefined,
      url: `https://lupra.app/${project.slug}`,
      siteName: "Lupra",
      locale: "tr_TR",
      type: "article",
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

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" aria-label="Lupra ana sayfa">
            <Logo />
          </Link>
          <Link
            href="/#early-access"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Erken erişim
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <article>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-white">
            {project.title}
          </h1>
          {project.summary && (
            <p className="mt-4 text-lg leading-relaxed text-muted">{project.summary}</p>
          )}
          <div className="prose-lupra mt-12">
            <ReactMarkdown>{project.content}</ReactMarkdown>
          </div>
        </article>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8 text-sm text-muted">
          <span>© {new Date().getFullYear()} Lupra</span>
          <Link href="/" className="transition-colors hover:text-white">
            lupra.app
          </Link>
        </div>
      </footer>
    </div>
  );
}
