import { requireAdmin } from "@/lib/dal";
import { listAuditLogs } from "@/lib/admin-data";
import { auditLabel } from "@/lib/audit-log";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { EmptyState, TablePanel, Td, Th, Tr } from "../components/AdminTable";

export const metadata = {
  title: "Aktivite | Admin",
};

/** details JSONB'sinden okunabilir bir özet çıkarır. */
function describeDetails(details: Record<string, unknown> | null): string | null {
  if (!details) return null;

  const parts: string[] = [];
  if (typeof details.slug === "string") parts.push(`/${details.slug}`);
  if (typeof details.target_email === "string") parts.push(details.target_email);
  if (typeof details.record_count === "number") parts.push(`${details.record_count} kayıt`);
  if (typeof details.total === "number") parts.push(`${details.total} kayıt`);

  return parts.length ? parts.join(" · ") : null;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);

  const { rows, total, pageCount } = await listAuditLogs({ page, pageSize: DEFAULT_PAGE_SIZE });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Aktivite Kaydı</h1>
        <p className="mt-2 text-sm text-muted">
          Panelde yapılan işlemlerin kaydı — kim, ne zaman, ne yaptı.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Henüz hiç aktivite kaydedilmedi."
          hint="Giriş, çıkış, proje düzenleme ve CSV indirme işlemleri burada listelenir."
        />
      ) : (
        <>
          <TablePanel>
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <Th>Yönetici</Th>
                <Th>İşlem</Th>
                <Th>Detay</Th>
                <Th>Tarih</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const detail = describeDetails(log.details);
                return (
                  <Tr key={log.id}>
                    <Td className="font-medium text-white">{log.admin_email}</Td>
                    <Td className="text-muted">{auditLabel(log.action)}</Td>
                    <Td className="font-mono text-xs text-muted/70">{detail ?? "—"}</Td>
                    <Td className="text-xs text-muted">{formatDateTime(log.created_at)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </TablePanel>

          <Pagination
            basePath="/admin/activity"
            filters={{}}
            page={page}
            pageCount={pageCount}
            total={total}
            label="işlem"
          />
        </>
      )}
    </div>
  );
}
