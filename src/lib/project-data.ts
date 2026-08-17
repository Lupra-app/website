import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseBlocks, type Block } from "@/lib/blocks";

/**
 * Projelerin HERKESE AÇIK okumaları.
 *
 * blog-data.ts ile aynı sözleşme: bu dosyadaki hiçbir fonksiyon yetki
 * istemez, karşılığında da YALNIZCA yayında olanı döndürmek zorundadır.
 * `status = 'published'` filtresi her sorgunun içinde, çağırana bırakılmıyor —
 * unutulursa taslaklar siteye sızardı.
 */

export type ProjectSummary = {
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  updated_at: string;
};

export type ProjectDetail = ProjectSummary & {
  content: string;
  blocks: Block[];
};

export async function listPublishedProjects(limit?: number): Promise<ProjectSummary[]> {
  let query = getSupabaseAdmin()
    .from("projects")
    .select("slug, title, summary, cover_url, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    // Tablo yoksa ya da sorgu bozuksa ana sayfa çökmesin; bölüm gizlenir.
    console.error("[projeler] okunamadı:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

/**
 * cache(): sayfa gövdesi ve generateMetadata aynı projeyi istiyor; memoize
 * edilmezse her istekte iki ayrı sorgu giderdi.
 */
export const getPublishedProject = cache(async (slug: string): Promise<ProjectDetail | null> => {
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
