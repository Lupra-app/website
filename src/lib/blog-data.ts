import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseBlocks, type Block } from "@/lib/blocks";

/**
 * Blog'un HERKESE AÇIK okumaları.
 *
 * admin-data.ts'ten ayrı bir dosya olmasının sebebi, oradaki sözleşme: o
 * dosyadaki her fonksiyon `requireAdmin()` ile başlar. Buradakiler ise
 * ziyaretçiler için ve yetki istemiyor — ama karşılığında YALNIZCA yayında
 * olan içeriği döndürmek zorundalar. İki kuralı tek dosyada tutmak, birinin
 * diğerinin yerine geçmesini kolaylaştırırdı.
 *
 * Service-role ile okunuyor çünkü tablolarda RLS açık ve policy yok; yayın
 * filtresi (`status = 'published'`) bu yüzden burada, sorgunun içinde.
 */

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  tags: string[];
  published_at: string | null;
  reading_minutes: number | null;
};

export type PostDetail = PostSummary & {
  id: string;
  blocks: Block[];
  updated_at: string;
  project: { slug: string; title: string } | null;
};

export type PublicComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const SUMMARY_FIELDS = "slug, title, excerpt, cover_url, tags, published_at, reading_minutes";

export async function listPublishedPosts(tag?: string): Promise<PostSummary[]> {
  let query = getSupabaseAdmin()
    .from("posts")
    .select(SUMMARY_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  if (error) {
    console.error("[blog] yazılar okunamadı:", error.code, error.message);
    return [];
  }
  return (data ?? []) as PostSummary[];
}

/**
 * cache(): sayfa gövdesi ve generateMetadata aynı yazıyı istiyor; memoize
 * edilmezse her istekte iki ayrı sorgu giderdi.
 */
export const getPublishedPost = cache(async (slug: string): Promise<PostDetail | null> => {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select(
      `id, ${SUMMARY_FIELDS}, blocks, updated_at, projects ( slug, title )`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  // PostgREST ilişkiyi tekil ya da dizi olarak döndürebiliyor; ikisini de kabul et.
  const rel = row.projects as { slug: string; title: string } | { slug: string; title: string }[] | null;
  const project = Array.isArray(rel) ? (rel[0] ?? null) : rel;

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: (row.excerpt as string | null) ?? null,
    cover_url: (row.cover_url as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? [],
    published_at: (row.published_at as string | null) ?? null,
    reading_minutes: (row.reading_minutes as number | null) ?? null,
    updated_at: String(row.updated_at),
    blocks: parseBlocks(row.blocks),
    project,
  };
});

/** Yalnızca ONAYLANMIŞ yorumlar. Bekleyen ve spam olanlar sitede görünmez. */
export async function listApprovedComments(postId: string): Promise<PublicComment[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("comments")
    .select("id, author_name, body, created_at")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[blog] yorumlar okunamadı:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

/** Blog listesindeki etiket filtreleri için. */
export async function listPublishedTags(): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("tags")
    .eq("status", "published");

  if (error) return [];

  const seen = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of ((row as { tags: string[] | null }).tags ?? [])) {
      if (tag.trim()) seen.add(tag.trim());
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "tr"));
}
