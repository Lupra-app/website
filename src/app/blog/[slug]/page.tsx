import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, listApprovedComments } from "@/lib/blog-data";
import { blocksToPlainText, collectFaqItems } from "@/lib/blocks";
import { BlockRenderer } from "@/components/BlockRenderer";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { formatDate } from "@/lib/format";
import { CommentSection } from "./components/CommentSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};

  const description = post.excerpt ?? blocksToPlainText(post.blocks) ?? undefined;
  const url = `https://lupra.app/blog/${post.slug}`;

  return {
    title: `${post.title} | Lupra Blog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "Lupra",
      locale: "tr_TR",
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags,
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const comments = await listApprovedComments(post.id);
  const faqItems = collectFaqItems(post.blocks);
  const url = `https://lupra.app/blog/${post.slug}`;
  const description = post.excerpt ?? blocksToPlainText(post.blocks);

  // Yapılandırılmış veri: Google JSON-LD öneriyor ve bu artık yalnızca rich
  // snippet için değil — hem arama motorlarının hem yapay zeka sistemlerinin
  // içeriği anlayıp DOĞRU alıntılaması için temel sinyal (SEO rehberi 2.4).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: description || undefined,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    inLanguage: "tr-TR",
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "Lupra", url: "https://lupra.app" },
    publisher: {
      "@type": "Organization",
      name: "Lupra",
      url: "https://lupra.app",
      logo: { "@type": "ImageObject", url: "https://lupra.app/icon.png" },
    },
  };

  // FAQ bloğu varsa ayrıca FAQPage — bu, cevabın arama sonucunda ve LLM
  // cevaplarında doğrudan görünme şansını artıran biçim.
  const faqJsonLd = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: "https://lupra.app" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://lupra.app/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-bg text-white">
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].filter(Boolean).map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      <SiteHeader />

      <main className="pb-24">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
            <nav aria-label="Sayfa yolu" className="mb-6 text-xs text-muted">
              <Link href="/blog" className="transition-colors hover:text-white">
                Blog
              </Link>
              {post.tags[0] && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/blog?etiket=${encodeURIComponent(post.tags[0])}`}
                    className="transition-colors hover:text-white"
                  >
                    {post.tags[0]}
                  </Link>
                </>
              )}
            </nav>

            <h1 className="font-heading text-3xl font-semibold leading-tight text-white md:text-5xl">
              {post.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              {post.published_at && (
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              )}
              {post.reading_minutes && <span>· {post.reading_minutes} dk okuma</span>}
              {post.project && (
                <>
                  <span>·</span>
                  <Link
                    href={`/${post.project.slug}`}
                    className="text-accent-light transition-colors hover:text-white"
                  >
                    {post.project.title}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {post.cover_url && (
          <div className="mx-auto max-w-5xl px-6 pt-10">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */}
            <img
              src={post.cover_url}
              alt=""
              className="w-full rounded-2xl border border-white/10"
            />
          </div>
        )}

        <article className="pt-12 md:pt-16">
          <BlockRenderer blocks={post.blocks} />
        </article>

        <div className="mx-auto mt-20 max-w-3xl px-6">
          <CommentSection postId={post.id} comments={comments} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
