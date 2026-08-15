import { getSupabaseServer } from "@/lib/supabase-server";

interface EarlyAccessRecord {
  id: string;
  email: string;
  created_at: string;
}

async function fetchEarlyAccess(): Promise<{
  data: EarlyAccessRecord[];
  error: string | null;
}> {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("early_access")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export async function EarlyAccessTable() {
  const { data, error } = await fetchEarlyAccess();

  if (error) {
    console.error("Early access fetch error:", error);
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-8 py-12 text-center">
        <p className="text-sm text-muted">Henüz hiçbir kayıt yok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-6 py-4 text-left font-semibold text-white">
              E-posta
            </th>
            <th className="px-6 py-4 text-left font-semibold text-white">
              Tarih
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((record, idx) => (
            <tr
              key={record.id}
              className={`border-b border-white/5 ${
                idx % 2 === 0 ? "bg-white/[0.01]" : ""
              } hover:bg-white/10 transition-colors`}
            >
              <td className="px-6 py-4 text-white">{record.email}</td>
              <td className="px-6 py-4 text-muted">
                {new Date(record.created_at).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-white/10 px-6 py-3 text-xs text-muted">
        Toplam: {data.length} kayıt
      </div>
    </div>
  );
}
