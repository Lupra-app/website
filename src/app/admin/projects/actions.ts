"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";
import { SLUG_RE, UUID_RE } from "@/lib/validation";
import { parseBlocks, type Block } from "@/lib/blocks";
import type { ProjectFormState } from "./form-state";

/**
 * Hata durumunda REDIRECT ETMİYORUZ, state döndürüyoruz.
 *
 * Eskiden hatalar `?error=...` ile geri yönlendiriliyordu; bu tam bir
 * navigasyon olduğu için form baştan render ediliyor ve kullanıcının yazdığı
 * her şey (100.000 karaktere kadar markdown) siliniyordu. useActionState ile
 * hatada navigasyon olmaz, client component mount'ta kalır ve uncontrolled
 * input'ların DOM değerleri hiç kaybolmaz.
 *
 * Durum tipi ve başlangıç değeri ./form-state içinde: bu dosya "use server"
 * olduğu için buradan yalnızca async fonksiyon export edilebilir.
 */

// Kök seviyede route'u olan (veya olacak) path'ler bir projeyle gölgelenemez.
// Statik route'lar zaten dinamik segmentten önce eşleşir, ama admin'in
// "yayında ama hiç açılmayan" bir sayfa oluşturmasına izin vermeyelim.
const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "api",
  "auth",
  "blog",
  "robots.txt",
  "sitemap.xml",
]);

const MAX_SLUG = 80;
const MAX_TITLE = 140;
const MAX_SUMMARY = 300;
const MAX_CONTENT = 100_000;

type ProjectFields = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  blocks: Block[];
  status: "draft" | "published";
};

function parseFields(formData: FormData): { fields?: ProjectFields; error?: string } {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  // Bloklar tarayıcıda JSON'a çevrilip gizli bir input'la geliyor, yani
  // tamamen istemci kontrolünde. parseBlocks beyaz liste mantığıyla yeniden
  // inşa ediyor — güvenlik sınırı burası.
  const blocks = parseBlocks(formData.get("blocks"));

  if (!title || title.length > MAX_TITLE) return { error: "invalid_title" };
  if (!SLUG_RE.test(slug) || slug.length > MAX_SLUG) return { error: "invalid_slug" };
  if (RESERVED_SLUGS.has(slug)) return { error: "reserved_slug" };
  if (summary.length > MAX_SUMMARY) return { error: "invalid_summary" };
  if (content.length > MAX_CONTENT) return { error: "content_too_long" };

  return { fields: { slug, title, summary, content, coverUrl, blocks, status } };
}

function revalidateProject(slug: string) {
  revalidatePath(`/${slug}`);
  // sitemap.ts service-role ile okuyor ve cookies()'e dokunmuyor, yani
  // varsayılan olarak cache'leniyor. Yayın durumu değişince tazelenmesi lazım.
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/projects");
}

/** Tek action: gizli `id` alanı varsa günceller, yoksa oluşturur. */
export async function saveProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (id && !UUID_RE.test(id)) return { error: "not_found" };

  const { fields, error } = parseFields(formData);
  if (!fields) return { error: error ?? "server_error" };

  const supabase = getSupabaseAdmin();

  if (!id) {
    const { data, error: dbError } = await supabase
      .from("projects")
      .insert({
        slug: fields.slug,
        title: fields.title,
        summary: fields.summary || null,
        content: fields.content,
        cover_url: fields.coverUrl || null,
        blocks: fields.blocks,
        status: fields.status,
      })
      .select("id")
      .single();

    // 23505 = unique violation → slug zaten kullanımda
    if (dbError) return { error: dbError.code === "23505" ? "slug_taken" : "server_error" };

    await logAdminAction({
      admin_email: session.email,
      action: "create_project",
      details: { project_id: data?.id, slug: fields.slug, status: fields.status },
    });
    revalidateProject(fields.slug);
  } else {
    // Slug değişmiş olabilir: eski public sayfayı da tazelemek için okuyoruz.
    const { data: existing } = await supabase
      .from("projects")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    // .select() olmadan Supabase kaç satırın etkilendiğini söylemiyor; onsuz
    // var olmayan bir id "başarıyla güncellendi" gibi dönüyordu.
    const { data: updated, error: dbError } = await supabase
      .from("projects")
      .update({
        slug: fields.slug,
        title: fields.title,
        summary: fields.summary || null,
        content: fields.content,
        cover_url: fields.coverUrl || null,
        blocks: fields.blocks,
        status: fields.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");

    if (dbError) return { error: dbError.code === "23505" ? "slug_taken" : "server_error" };
    if (!updated?.length) return { error: "not_found" };

    await logAdminAction({
      admin_email: session.email,
      action: "update_project",
      details: { project_id: id, slug: fields.slug, status: fields.status },
    });
    if (existing && existing.slug !== fields.slug) revalidatePath(`/${existing.slug}`);
    revalidateProject(fields.slug);
  }

  // redirect() bir kontrol-akışı istisnası fırlatır, bu yüzden dönüş tipine
  // ulaşılmaz ve try bloğunun dışında olmalı — burada öyle.
  redirect("/admin/projects");
}

export async function deleteProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) return { error: "not_found" };

  // .select() hem "kaç satır silindi"yi hem de log için slug'ı tek turda verir.
  const { data: deleted, error: dbError } = await getSupabaseAdmin()
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id, slug");

  if (dbError) return { error: "server_error" };
  if (!deleted?.length) return { error: "not_found" };

  await logAdminAction({
    admin_email: session.email,
    action: "delete_project",
    details: { project_id: id, slug: deleted[0].slug },
  });
  revalidateProject(deleted[0].slug);

  redirect("/admin/projects");
}
