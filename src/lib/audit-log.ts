import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Admin panel aktivite kaydı.
 *
 * Eskiden bu dosya service-role anahtarını @supabase/ssr'ın createServerClient'ına
 * cookie adapter'ıyla birlikte veriyordu; bu kombinasyon çalışmaz, çünkü
 * SupabaseClient._getAccessToken() oturum JWT'sini anahtarın önüne geçirir.
 * Yani istek `authenticated` rolüyle gidiyor, RLS reddediyor ve insert'in
 * dönüş {error}'ü okunmadığı için hiç kimse fark etmiyordu — tablo aylarca
 * boş kaldı. Artık gerçek service-role client kullanılıyor ve hata loglanıyor.
 */

/**
 * Eylem kodları ve Türkçe etiketleri. Tek kaynak: aktivite sayfası bu
 * haritadan okuyor, dolayısıyla yeni bir eylem eklenip etiketi unutulursa
 * TypeScript derlemede yakalar (eskiden ham İngilizce kod ekrana basılıyordu).
 */
export const AUDIT_ACTIONS = {
  login: "Giriş yapıldı",
  logout: "Çıkış yapıldı",
  export_early_access_csv: "Erken erişim CSV'si indirildi",
  update_early_access_status: "Erken erişim kaydı güncellendi",
  // Artık üretilmiyor (liste görüntüleme loglaması kaldırıldı), ama tablodaki
  // eski satırların etiketi için burada duruyor.
  view_early_access: "Erken erişim listesi görüntülendi",
  create_project: "Proje oluşturuldu",
  update_project: "Proje güncellendi",
  delete_project: "Proje silindi",
  create_post: "Yazı oluşturuldu",
  update_post: "Yazı güncellendi",
  delete_post: "Yazı silindi",
  moderate_comment: "Yorum denetlendi",
  add_admin: "Yönetici eklendi",
  remove_admin: "Yönetici çıkarıldı",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export function auditLabel(action: string): string {
  return AUDIT_ACTIONS[action as AuditAction] ?? action;
}

interface LogEntry {
  admin_email: string;
  action: AuditAction;
  details?: Record<string, unknown>;
}

/**
 * Kayıt başarısız olursa çağıran akış BOZULMAZ — loglama, kullanıcının
 * yapmaya çalıştığı işi engellememeli. Ama sessizce de yutulmaz: hem
 * Supabase'in döndürdüğü {error} hem de beklenmeyen exception loglanır.
 */
export async function logAdminAction(entry: LogEntry): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().from("audit_logs").insert({
      admin_email: entry.admin_email,
      action: entry.action,
      details: entry.details ?? null,
    });

    if (error) {
      console.error("[audit] kayıt yazılamadı:", error.code, error.message);
    }
  } catch (err) {
    console.error("[audit] beklenmeyen hata:", err);
  }
}
