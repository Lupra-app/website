"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";
import { SLUG_RE, UUID_RE } from "@/lib/validation";
import { parseBlocks, readingMinutes, type Block } from "@/lib/blocks";
import type { CommentActionState, PostFormState } from "./form-state";

// Blog altında kök seviye çakışması yok ama bu slug'lar route olarak kullanılıyor.
const RESERVED_SLUGS = new Set(["rss.xml", "new", "api"]);

const MAX_SLUG = 90;
const MAX_TITLE = 160;
const MAX_EXCERPT = 300;
const MAX_TAGS = 6;

type PostFields = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string;
  tags: string[];
  blocks: Block[];
  projectId: string | null;
  status: "draft" | "published";
};

function parseFields(formData: FormData): { fields?: PostFields; error?: string } {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  // Etiketler virgülle giriliyor; boşluk ve tekrarlar temizleniyor.
  const tags = [
    ...new Set(
      String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.slice(0, 40))
    ),
  ].slice(0, MAX_TAGS);

  // Bloklar tarayıcıda JSON'a çevrilip gizli bir input'la geliyor, yani
  // tamamen istemci kontrolünde. parseBlocks güvenlik sınırı.
  const blocks = parseBlocks(formData.get("blocks"));

  if (!title || title.length > MAX_TITLE) return { error: "invalid_title" };
  if (!SLUG_RE.test(slug) || slug.length > MAX_SLUG) return { error: "invalid_slug" };
  if (RESERVED_SLUGS.has(slug)) return { error: "reserved_slug" };
  if (excerpt.length > MAX_EXCERPT) return { error: "invalid_excerpt" };

  return {
    fields: {
      slug,
      title,
      excerpt,
      coverUrl,
      tags,
      blocks,
      projectId: UUID_RE.test(projectId) ? projectId : null,
      status,
    },
  };
}

function revalidatePost(slug: string) {
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

/** Tek action: gizli `id` alanı varsa günceller, yoksa oluşturur. */
export async function savePost(
  _prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (id && !UUID_RE.test(id)) return { error: "not_found" };

  const { fields, error } = parseFields(formData);
  if (!fields) return { error: error ?? "server_error" };

  const supabase = getSupabaseAdmin();

  const payload = {
    slug: fields.slug,
    title: fields.title,
    excerpt: fields.excerpt || null,
    cover_url: fields.coverUrl || null,
    tags: fields.tags,
    blocks: fields.blocks,
    project_id: fields.projectId,
    status: fields.status,
    reading_minutes: readingMinutes(fields.blocks),
    updated_at: new Date().toISOString(),
  };

  if (!id) {
    const { data, error: dbError } = await supabase
      .from("posts")
      .insert({
        ...payload,
        // İlk kez yayınlanıyorsa yayın tarihi şimdi.
        published_at: fields.status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (dbError) return { error: dbError.code === "23505" ? "slug_taken" : "server_error" };

    await logAdminAction({
      admin_email: session.email,
      action: "create_post",
      details: { post_id: data?.id, slug: fields.slug, status: fields.status },
    });
    revalidatePost(fields.slug);
  } else {
    const { data: existing } = await supabase
      .from("posts")
      .select("slug, published_at")
      .eq("id", id)
      .maybeSingle();

    const { data: updated, error: dbError } = await supabase
      .from("posts")
      .update({
        ...payload,
        // Yayın tarihi ilk yayınlamada bir kez yazılır; sonraki düzenlemeler
        // onu ileri taşımaz, yoksa yazı her düzeltmede "yeni" görünürdü.
        published_at:
          fields.status === "published"
            ? (existing?.published_at ?? new Date().toISOString())
            : existing?.published_at ?? null,
      })
      .eq("id", id)
      .select("id");

    if (dbError) return { error: dbError.code === "23505" ? "slug_taken" : "server_error" };
    if (!updated?.length) return { error: "not_found" };

    await logAdminAction({
      admin_email: session.email,
      action: "update_post",
      details: { post_id: id, slug: fields.slug, status: fields.status },
    });
    if (existing && existing.slug !== fields.slug) revalidatePath(`/blog/${existing.slug}`);
    revalidatePost(fields.slug);
  }

  redirect("/admin/blog");
}

export async function deletePost(
  _prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) return { error: "not_found" };

  // Yorumlar posts'a foreign key ile bağlı ve ON DELETE CASCADE — yazı
  // silinince yorumları da gider.
  const { data: deleted, error } = await getSupabaseAdmin()
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id, slug");

  if (error) return { error: "server_error" };
  if (!deleted?.length) return { error: "not_found" };

  await logAdminAction({
    admin_email: session.email,
    action: "delete_post",
    details: { post_id: id, slug: deleted[0].slug },
  });
  revalidatePost(deleted[0].slug);

  redirect("/admin/blog");
}

/** Yorum moderasyonu: onayla / spam işaretle / beklemeye al. */
export async function moderateComment(
  _prevState: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) return { error: "not_found", done: false };

  const status = String(formData.get("status") ?? "");
  if (!["pending", "approved", "spam"].includes(status)) {
    return { error: "invalid_status", done: false };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("comments")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.email,
    })
    .eq("id", id)
    .select("id, post_id, posts ( slug )");

  if (error) {
    console.error("[comments] güncellenemedi:", error.code, error.message);
    return { error: "server_error", done: false };
  }
  if (!data?.length) return { error: "not_found", done: false };

  await logAdminAction({
    admin_email: session.email,
    action: "moderate_comment",
    details: { comment_id: id, status },
  });

  // Onaylanan yorum yazı sayfasında görünmeli, kaldırılan kaybolmalı.
  const rel = (data[0] as Record<string, unknown>).posts as { slug: string } | { slug: string }[] | null;
  const slug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");

  return { error: null, done: true };
}
