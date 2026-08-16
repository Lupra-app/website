import { listPublishedPosts } from "@/lib/blog-data";

/** XML'de metin: & < > karakterleri kaçırılmazsa besleme ayrıştırılamaz. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await listPublishedPosts();
  const site = "https://lupra.app";

  const items = posts
    .map((post) => {
      const url = `${site}/blog/${post.slug}`;
      const date = post.published_at ? new Date(post.published_at).toUTCString() : "";
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>${date ? `\n      <pubDate>${date}</pubDate>` : ""}
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lupra Blog</title>
    <link>${site}/blog</link>
    <description>Yapay zeka agent'larıyla operasyonel otomasyon üzerine yazılar.</description>
    <language>tr-TR</language>
    <atom:link href="${site}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Beslemeyi her istekte üretmek gereksiz; bir saatlik önbellek yeter.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
