import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { toRange, pageCount } from "@/lib/pagination";

/**
 * Admin panelinin TÜM veri okumaları burada.
 *
 * SÖZLEŞME: bu dosyadaki her export edilen fonksiyonun ilk satırı
 * `await requireAdmin()` olmak zorundadır.
 *
 * Neden tek dosya: tablolarda RLS açık ama policy yok, yani veritabanı
 * "bu kullanıcı bunu görebilir mi" sorusuna cevap VERMİYOR — service-role
 * her şeyi görüyor. Yetkilendirmenin tamamı uygulama katmanında olduğu için
 * okumaları dağıtmak yerine tek yerde topluyoruz: yeni bir sayfa yetki
 * kontrolünü unutamaz, çünkü sorguyu buradan almak zorunda.
 *
 * Hatalar YUTULMAZ, fırlatılır. Boş dizi döndürmek "kayıt yok" ile "sorgu
 * kırık"ı ayırt edilemez hale getiriyordu — panelin aylarca boş görünmesinin
 * sebebi tam olarak buydu. Fırlatılan hata error.tsx sınırına düşer.
 */

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type EarlyAccessRow = { id: string; email: string; created_at: string };
export type AuditLogRow = {
  id: string;
  admin_email: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};
export type ProjectListRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updated_at: string;
};
export type ProjectRow = ProjectListRow & { summary: string | null; content: string };
export type AdminUserRow = { id: string; email: string; created_at: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgREST `ilike` kalıbındaki joker karakterleri kaçırır. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function fail(what: string, error: { code?: string; message: string }): never {
  // PGRST205 = tablo PostgREST şema önbelleğinde yok, yani migration hiç
  // çalıştırılmamış. Ham PostgREST mesajı yerine ne yapılacağını söyleyelim.
  if (error.code === "PGRST205") {
    throw new Error(
      `${what} okunamadı: ilgili tablo Supabase'de yok. supabase/schema.sql dosyasını Supabase → SQL Editor'da çalıştır.`
    );
  }
  throw new Error(`${what} okunamadı (${error.code ?? "?"}): ${error.message}`);
}

export async function getDashboardStats() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  // DİKKAT: projects sorgusunda `head: true` KULLANMA. PostgREST bir HEAD
  // isteğinde gövde döndüremediği için tablo eksik olsa bile hata değil,
  // sessizce `{ error: null, count: null }` döner — yani eksik tablo "0 proje"
  // gibi görünürdü. Gerçek bir satır seçmek hatayı görünür kılıyor.
  const [earlyAccess, projects, published, admins, audit, lastLog] = await Promise.all([
    supabase.from("early_access").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact" }).limit(1),
    supabase.from("projects").select("id", { count: "exact" }).eq("status", "published").limit(1),
    supabase.from("admin_users").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  if (earlyAccess.error) fail("Erken erişim sayısı", earlyAccess.error);
  if (admins.error) fail("Yönetici sayısı", admins.error);
  if (audit.error) fail("Aktivite sayısı", audit.error);
  // projects tablosu henüz oluşturulmamış olabilir. Panelin geri kalanı bu
  // yüzden çökmesin; kontrol paneli bunun yerine "SQL'i çalıştır" uyarısı
  // gösterir (diğer sayfalar zaten anlaşılır bir hata veriyor).
  const projectsTableMissing = projects.error?.code === "PGRST205";
  if (projects.error && !projectsTableMissing) fail("Proje sayısı", projects.error);

  return {
    earlyAccessCount: earlyAccess.count ?? 0,
    projectCount: projects.count ?? 0,
    publishedCount: published.count ?? 0,
    adminCount: admins.count ?? 0,
    auditCount: audit.count ?? 0,
    lastActivityAt: lastLog.data?.[0]?.created_at ?? null,
    projectsTableMissing,
  };
}

export async function listEarlyAccess(opts: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<Paged<EarlyAccessRow>> {
  await requireAdmin();
  const [from, to] = toRange(opts.page, opts.pageSize);

  let query = getSupabaseAdmin()
    .from("early_access")
    .select("id, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.q) query = query.ilike("email", `%${escapeLike(opts.q)}%`);

  const { data, error, count } = await query;
  if (error) fail("Erken erişim kayıtları", error);

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    pageCount: pageCount(total, opts.pageSize),
  };
}

/** CSV export için tüm kayıtlar — sayfalama yok, kasıtlı. */
export async function listEarlyAccessForExport(): Promise<EarlyAccessRow[]> {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin()
    .from("early_access")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) fail("Erken erişim kayıtları", error);
  return data ?? [];
}

export async function listAuditLogs(opts: {
  page: number;
  pageSize: number;
  action?: string;
}): Promise<Paged<AuditLogRow>> {
  await requireAdmin();
  const [from, to] = toRange(opts.page, opts.pageSize);

  let query = getSupabaseAdmin()
    .from("audit_logs")
    .select("id, admin_email, action, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.action) query = query.eq("action", opts.action);

  const { data, error, count } = await query;
  if (error) fail("Aktivite kayıtları", error);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as AuditLogRow[],
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    pageCount: pageCount(total, opts.pageSize),
  };
}

export async function listProjects(opts: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}): Promise<Paged<ProjectListRow>> {
  await requireAdmin();
  const [from, to] = toRange(opts.page, opts.pageSize);

  let query = getSupabaseAdmin()
    .from("projects")
    .select("id, slug, title, status, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (opts.q) query = query.ilike("title", `%${escapeLike(opts.q)}%`);
  if (opts.status === "draft" || opts.status === "published") {
    query = query.eq("status", opts.status);
  }

  const { data, error, count } = await query;
  if (error) fail("Projeler", error);

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    pageCount: pageCount(total, opts.pageSize),
  };
}

/**
 * Geçersiz UUID'de null döner, sorguya hiç gitmez: Postgres'e bozuk uuid
 * göndermek 22P02 fırlatır ve kullanıcı anlamsız bir sunucu hatası görür.
 */
export async function getProjectById(id: string): Promise<ProjectRow | null> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("projects")
    .select("id, slug, title, summary, content, status, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) fail("Proje", error);
  return data;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin()
    .from("admin_users")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  if (error) fail("Yöneticiler", error);
  return data ?? [];
}
