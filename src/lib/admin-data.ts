import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { toRange, pageCount } from "@/lib/pagination";
import { parseBlocks, type Block } from "@/lib/blocks";

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

export type EarlyAccessStatus = "new" | "invited" | "joined";

export type EarlyAccessRow = {
  id: string;
  email: string;
  created_at: string;
  source_referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  country: string | null;
  status: string;
  note: string | null;
  status_updated_at: string | null;
};

const EARLY_ACCESS_FIELDS =
  "id, email, created_at, source_referrer, utm_source, utm_medium, utm_campaign, device_type, browser, os, language, country, status, note, status_updated_at";
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
  cover_url: string | null;
};
export type ProjectRow = ProjectListRow & {
  summary: string | null;
  content: string;
  cover_url: string | null;
  blocks: Block[];
};
export type AdminUserRow = { id: string; email: string; created_at: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgREST `ilike` kalıbındaki joker karakterleri kaçırır. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function fail(what: string, error: { code?: string; message: string }): never {
  // PGRST205 = tablo şema önbelleğinde yok, 42703 = kolon yok. İkisi de aynı
  // sebepten olur: supabase/schema.sql güncellendi ama SQL Editor'da
  // çalıştırılmadı. Ham PostgREST mesajı yerine ne yapılacağını söyleyelim.
  if (error.code === "PGRST205" || error.code === "42703") {
    throw new Error(
      `${what} okunamadı: veritabanı şeması güncel değil. supabase/schema.sql dosyasını Supabase → SQL Editor'da çalıştır.`
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
  status?: string;
}): Promise<Paged<EarlyAccessRow>> {
  await requireAdmin();
  const [from, to] = toRange(opts.page, opts.pageSize);

  let query = getSupabaseAdmin()
    .from("early_access")
    .select(EARLY_ACCESS_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.q) query = query.ilike("email", `%${escapeLike(opts.q)}%`);
  if (opts.status === "new" || opts.status === "invited" || opts.status === "joined") {
    query = query.eq("status", opts.status);
  }

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
    .select(EARLY_ACCESS_FIELDS)
    .order("created_at", { ascending: false });

  if (error) fail("Erken erişim kayıtları", error);
  return (data ?? []) as unknown as EarlyAccessRow[];
}

/**
 * Listenin üstündeki özet kartları.
 *
 * Sayımlar veritabanında yapılıyor (head + count), satırlar çekilip JS'te
 * sayılmıyor — liste büyüdüğünde de sabit maliyette kalsın diye. Kaynak
 * dağılımı için satır çekmek gerekiyor ama yalnızca tek bir kolon okunuyor.
 */
export async function getEarlyAccessStats() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

  const [total, today, week, invited, joined, sources] = await Promise.all([
    supabase.from("early_access").select("*", { count: "exact", head: true }),
    supabase.from("early_access").select("*", { count: "exact", head: true }).gte("created_at", startOfToday),
    supabase.from("early_access").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("early_access").select("*", { count: "exact", head: true }).eq("status", "invited"),
    supabase.from("early_access").select("*", { count: "exact", head: true }).eq("status", "joined"),
    supabase.from("early_access").select("utm_source, source_referrer"),
  ]);

  if (total.error) fail("Erken erişim özeti", total.error);

  // En çok kayıt getiren kanal: kampanya etiketi varsa o, yoksa referrer'ın
  // alan adı, o da yoksa "doğrudan".
  const tally = new Map<string, number>();
  for (const row of sources.data ?? []) {
    const utm = (row as { utm_source: string | null }).utm_source;
    const ref = (row as { source_referrer: string | null }).source_referrer;
    let key = "Doğrudan";
    if (utm) key = utm;
    else if (ref) {
      try {
        key = new URL(ref).hostname.replace(/^www\./, "");
      } catch {
        key = ref.slice(0, 40);
      }
    }
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  const topSource = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  return {
    total: total.count ?? 0,
    today: today.count ?? 0,
    week: week.count ?? 0,
    invited: invited.count ?? 0,
    joined: joined.count ?? 0,
    topSource: topSource ? { name: topSource[0], count: topSource[1] } : null,
  };
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
    .select("id, slug, title, status, updated_at, cover_url", { count: "exact" })
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
    .select("id, slug, title, summary, content, cover_url, blocks, status, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) fail("Proje", error);
  if (!data) return null;

  // blocks JSONB olarak geliyor; editöre vermeden önce şeklini doğrula.
  return { ...data, blocks: parseBlocks(data.blocks) };
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
