import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: "https://lupra.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Yayınlanmış proje sayfaları (CMS). Supabase erişilemezse (ör. env'siz
  // build) sitemap ana sayfayla sınırlı kalır — hata sitemap'i düşürmesin.
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("status", "published");

    const projects: MetadataRoute.Sitemap = (data ?? []).map((project) => ({
      url: `https://lupra.app/${project.slug}`,
      lastModified: new Date(project.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...base, ...projects];
  } catch {
    return base;
  }
}
