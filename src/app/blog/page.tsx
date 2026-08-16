import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts, listPublishedTags } from "@/lib/blog-data";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog | Lupra",
  description:
    "Operasyonel işleri yapay zeka agent'larıyla otomatikleştirme üzerine yazılar: neyin işe yaradığı, neyin yaramadığı ve nedenleri.",
  alternates: {
    canonical: "https://lupra.app/blog",
    types: { "application/rss+xml": "https://lupra.app/blog/rss.xml" },
  },
  openGraph: {
    title: "Lupra Blog",
    description: "Yapay zeka agent'larıyla operasyonel otomasyon üzerine yazılar.",
    url: "https://lupra.app/blog",
    siteName: "Lupra",
    locale: "tr_TR",
    type: "website",
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ etiket?: string }>;
}) {
  const { etiket } = await searchParams;
  const [posts, tags] = await Promise.all([
    listPublishedPosts(etiket),
    listPublishedTags(),
  ]);

  return (
    <div className="min-h-screen bg-bg text-white">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <h1 className="font-heading text-4xl font-semibold text-white md:text-5xl">Blog</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Operasyonel işleri agent&apos;lara devretmek üzerine notlar — neyin işe
          yaradığı, neyin yaramadığı ve nedenleri.
        </p>

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/blog"
              aria-current={!etiket ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                !etiket
                  ? "border-accent/40 bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-muted hover:text-white"
              }`}
            >
              Tümü
            </Link>
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?etiket=${encodeURIComponent(tag)}`}
                aria-current={etiket === tag ? "true" : undefined}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  etiket === tag
                    ? "border-accent/40 bg-accent/15 text-white"
                    : "border-white/10 bg-white/5 text-muted hover:text-white"
                }`}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="mt-16 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center text-muted">
            {etiket
              ? `"${etiket}" etiketiyle henüz yazı yok.`
              : "Henüz yazı yayınlanmadı. Yakında burada olacak."}
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-white/25"
                >
                  {post.cover_url && (
                    /* eslint-disable-next-line @next/next/no-img-element -- Supabase
                       Storage'dan geliyor; next/image remotePatterns gerektirir. */
                    <img
                      src={post.cover_url}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted/70">
                      {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
                      {post.reading_minutes && <span>· {post.reading_minutes} dk okuma</span>}
                    </div>
                    <h2 className="mt-3 font-heading text-xl font-semibold leading-snug text-white">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                        {post.excerpt}
                      </p>
                    )}
                    {post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
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
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
