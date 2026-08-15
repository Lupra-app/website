"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAllowed } from "@/config/admin";
import { logAdminAction } from "@/lib/audit-log";

// URL-safe slug: küçük harf + rakam, tire ile ayrılmış. Tarayıcıdaki
// pattern attribute'u aynı ifadeyi kullanır; burası JS kapalıyken veya
// doğrudan POST edildiğinde devreye giren asıl kontrol.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Kök seviyede halihazırda route olan (veya olacak) path'ler — bir proje
// bunları gölgeleyemez. Statik route'lar zaten kazanır ama admin'in
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

// Server action'lar layout'un auth kontrolünden geçmez — her biri kendi
// başına bir endpoint'tir ve yetkiyi kendisi doğrulamak zorundadır.
async function requireAdmin(): Promise<string> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminAllowed(user.email))) {
    redirect("/login");
  }
  return user.email!;
}

type ProjectFields = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  status: "draft" | "published";
};

function parseFields(formData: FormData): { fields?: ProjectFields; error?: string } {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title || title.length > MAX_TITLE) return { error: "invalid_title" };
  if (!SLUG_RE.test(slug) || slug.length > MAX_SLUG) return { error: "invalid_slug" };
  if (RESERVED_SLUGS.has(slug)) return { error: "reserved_slug" };
  if (summary.length > MAX_SUMMARY) return { error: "invalid_summary" };
  if (content.length > MAX_CONTENT) return { error: "content_too_long" };

  return { fields: { slug, title, summary, content, status } };
}

function revalidateProject(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/projects");
}

export async function createProject(formData: FormData) {
  const adminEmail = await requireAdmin();
  const { fields, error } = parseFields(formData);
  if (!fields) redirect(`/admin/projects/new?error=${error}`);

  const supabase = getSupabaseAdmin();
  const { data, error: dbError } = await supabase
    .from("projects")
    .insert({
      slug: fields.slug,
      title: fields.title,
      summary: fields.summary || null,
      content: fields.content,
      status: fields.status,
    })
    .select("id")
    .single();

  if (dbError) {
    // 23505 = unique violation → slug zaten kullanımda
    redirect(
      `/admin/projects/new?error=${dbError.code === "23505" ? "slug_taken" : "server_error"}`
    );
  }

  await logAdminAction({
    admin_email: adminEmail,
    action: "create_project",
    details: { project_id: data?.id, slug: fields.slug, status: fields.status },
  });
  revalidateProject(fields.slug);
  redirect("/admin/projects");
}

export async function updateProject(formData: FormData) {
  const adminEmail = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/projects");

  const { fields, error } = parseFields(formData);
  if (!fields) redirect(`/admin/projects/${id}?error=${error}`);

  const supabase = getSupabaseAdmin();

  // Slug değişmiş olabilir: eski public sayfayı da revalidate etmek için oku.
  const { data: existing } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", id)
    .single();

  const { error: dbError } = await supabase
    .from("projects")
    .update({
      slug: fields.slug,
      title: fields.title,
      summary: fields.summary || null,
      content: fields.content,
      status: fields.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (dbError) {
    redirect(
      `/admin/projects/${id}?error=${dbError.code === "23505" ? "slug_taken" : "server_error"}`
    );
  }

  await logAdminAction({
    admin_email: adminEmail,
    action: "update_project",
    details: { project_id: id, slug: fields.slug, status: fields.status },
  });
  if (existing && existing.slug !== fields.slug) revalidatePath(`/${existing.slug}`);
  revalidateProject(fields.slug);
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  const adminEmail = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/projects");

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", id)
    .single();

  const { error: dbError } = await supabase.from("projects").delete().eq("id", id);
  if (dbError) redirect(`/admin/projects/${id}?error=server_error`);

  await logAdminAction({
    admin_email: adminEmail,
    action: "delete_project",
    details: { project_id: id, slug: existing?.slug },
  });
  if (existing) revalidateProject(existing.slug);
  redirect("/admin/projects");
}
