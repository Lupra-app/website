import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";

export const metadata = {
  title: "Projeler | Admin",
};

async function fetchProjects() {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("projects")
      .select("id, slug, title, status, updated_at")
      .order("updated_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export default async function ProjectsPage() {
  const { data, error } = await fetchProjects();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-white">Projeler</h1>
          <p className="mt-2 text-sm text-muted">
            lupra.app/&lt;slug&gt; altında yayınlanan proje sayfaları.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Yeni Proje
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Projeler yüklenemedi: {error}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center">
          <p className="text-sm text-muted">
            Henüz proje yok. İlkini oluşturmak için &quot;Yeni Proje&quot;ye tıkla.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-semibold text-muted">Başlık</th>
                <th className="px-6 py-4 font-semibold text-muted">Slug</th>
                <th className="px-6 py-4 font-semibold text-muted">Durum</th>
                <th className="px-6 py-4 font-semibold text-muted">Güncelleme</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {data.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/10"
                >
                  <td className="px-6 py-4 font-medium text-white">{project.title}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">/{project.slug}</td>
                  <td className="px-6 py-4">
                    {project.status === "published" ? (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        Yayında
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted">
                        Taslak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(project.updated_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {project.status === "published" && (
                        <a
                          href={`/${project.slug}`}
                          target="_blank"
                          className="text-xs text-muted transition-colors hover:text-white"
                        >
                          Görüntüle ↗
                        </a>
                      )}
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-xs font-semibold text-accent-light transition-colors hover:text-white"
                      >
                        Düzenle
                      </Link>
                    </div>
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
