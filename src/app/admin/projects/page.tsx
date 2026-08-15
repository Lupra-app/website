import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listProjects } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, parsePage, parseQuery, parseStatus } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchForm } from "../components/SearchForm";
import { EmptyState, StatusBadge, TablePanel, Td, Th, Tr } from "../components/AdminTable";

export const metadata = {
  title: "Projeler | Admin",
};

const STATUS_FILTERS = [
  { value: undefined, label: "Tümü" },
  { value: "published", label: "Yayında" },
  { value: "draft", label: "Taslak" },
] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);
  const status = parseStatus(sp.status);

  const { rows, total, pageCount } = await listProjects({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    q: q || undefined,
    status,
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Projeler</h1>
          <p className="mt-2 text-sm text-muted">
            lupra.app/&lt;slug&gt; altında yayınlanan proje sayfaları.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Yeni Proje
        </Link>
      </div>

      <SearchForm
        action="/admin/projects"
        defaultValue={q}
        placeholder="Başlıkta ara…"
        hidden={{ status }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (filter.value) params.set("status", filter.value);
          const href = params.toString() ? `/admin/projects?${params}` : "/admin/projects";

          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent/40 bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-muted hover:text-white"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={q || status ? "Bu filtreye uyan proje yok." : "Henüz proje yok."}
          hint={
            q || status
              ? "Filtreyi değiştir veya temizle."
              : 'İlkini oluşturmak için "Yeni Proje"ye tıkla.'
          }
        />
      ) : (
        <>
          <TablePanel>
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <Th>Başlık</Th>
                <Th>Slug</Th>
                <Th>Durum</Th>
                <Th>Güncelleme</Th>
                <Th className="text-right">İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => (
                <Tr key={project.id}>
                  <Td className="font-medium text-white">{project.title}</Td>
                  <Td className="font-mono text-xs text-muted">/{project.slug}</Td>
                  <Td>
                    <StatusBadge status={project.status} />
                  </Td>
                  <Td className="text-xs text-muted">{formatDateTime(project.updated_at)}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {project.status === "published" && (
                        <a
                          href={`/${project.slug}`}
                          target="_blank"
                          rel="noreferrer"
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
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TablePanel>

          <Pagination
            basePath="/admin/projects"
            filters={{ q: q || undefined, status }}
            page={page}
            pageCount={pageCount}
            total={total}
            label="proje"
          />
        </>
      )}
    </div>
  );
}
