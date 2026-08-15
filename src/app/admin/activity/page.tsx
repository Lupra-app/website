import { getSupabaseServer } from "@/lib/supabase-server";

async function fetchAuditLogs() {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, admin_email, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export const metadata = {
  title: "Aktivite | Admin",
};

export default async function ActivityPage() {
  const { data, error } = await fetchAuditLogs();

  interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }

  const actionLabels: Record<string, string> = {
    export_early_access_csv: "Erken Erişim CSV&apos;si İndirildi",
    view_early_access: "Erken Erişim Listesi Görüntülendi",
    login: "Giriş Yapıldı",
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-white">
        Aktivite Kaydı
      </h1>
      <p className="mt-2 text-sm text-muted">
        Admin panel&apos;deki tüm işlemler kaydediliyor.
      </p>

      {error ? (
        <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Loglar yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      ) : data.length === 0 ? (
        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 px-8 py-12 text-center">
          <p className="text-sm text-muted">Henüz hiçbir aktivite kaydedilmedi.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left font-semibold text-white">
                  Admin
                </th>
                <th className="px-6 py-4 text-left font-semibold text-white">
                  İşlem
                </th>
                <th className="px-6 py-4 text-left font-semibold text-white">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {(data as AuditLog[]).map((log, idx) => (
                <tr
                  key={log.id}
                  className={`border-b border-white/5 ${
                    idx % 2 === 0 ? "bg-white/[0.01]" : ""
                  } hover:bg-white/10 transition-colors`}
                >
                  <td className="px-6 py-4 text-white">{log.admin_email}</td>
                  <td className="px-6 py-4 text-accent">
                    {actionLabels[log.action] || log.action}
                    {log.details && typeof log.details === 'object' && 'record_count' in log.details && (
                      <span className="ml-2 text-xs text-muted">
                        ({String((log.details as Record<string, unknown>).record_count)} kayıt)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(log.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
