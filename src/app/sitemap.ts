import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Sitemap saatte bir yeniden üretilir.
 *
 * Bu satır olmadan Next sitemap'i build sırasında prerender ediyor: Supabase
 * sorgusu bir kez çalışıp sonucu HTML gibi donuyor. Yani yayınlanan her yeni
 * yazı ve ürün, bir sonraki deploy'a kadar sitemap'e HİÇ girmiyordu — içerik
 * sisteminin tamamı arama/LLM keşfi için kurulduğu hâlde.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: "https://lupra.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://lupra.app/urunler",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://lupra.app/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Yayınlanmış proje ve blog sayfaları. Supabase erişilemezse (ör. env'siz
  // build) sitemap temel sayfalarla sınırlı kalır — hata sitemap'i düşürmesin.
  try {
    const supabase = getSupabaseAdmin();

    const [projects, posts] = await Promise.all([
      supabase.from("projects").select("slug, updated_at").eq("status", "published"),
      supabase.from("posts").select("slug, updated_at, published_at").eq("status", "published"),
    ]);

    const projectEntries: MetadataRoute.Sitemap = (projects.data ?? []).map((project) => ({
      url: `https://lupra.app/${project.slug}`,
      lastModified: new Date(project.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const postEntries: MetadataRoute.Sitemap = (posts.data ?? []).map((post) => ({
      url: `https://lupra.app/blog/${post.slug}`,
      lastModified: new Date(post.updated_at ?? post.published_at ?? Date.now()),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...base, ...projectEntries, ...postEntries];
  } catch {
    return base;
  }
}
