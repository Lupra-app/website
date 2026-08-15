import { requireAdmin } from "@/lib/dal";
import { listEarlyAccess } from "@/lib/admin-data";
import { logAdminAction } from "@/lib/audit-log";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, parsePage, parseQuery } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchForm } from "../components/SearchForm";
import { EmptyState, TablePanel, Td, Th, Tr } from "../components/AdminTable";

export const metadata = {
  title: "Erken Erişim | Admin",
};

export default async function EarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);

  const { rows, total, pageCount } = await listEarlyAccess({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    q: q || undefined,
  });

  // Yalnızca ilk sayfada logla: her sayfa gezinmesinde kayıt atmak aktivite
  // tablosunu kısa sürede gürültüye boğardı.
  if (page === 1 && !q) {
    await logAdminAction({
      admin_email: session.email,
      action: "view_early_access",
      details: { total },
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">
            Erken Erişim Kayıtları
          </h1>
          <p className="mt-2 text-sm text-muted">
            Lupra&apos;ya erişim talebinde bulunan e-posta adreslerinin listesi.
          </p>
        </div>
        {total > 0 && (
          <a
            href="/api/admin/early-access-export"
            download
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            CSV&apos;ye Aktar
          </a>
        )}
      </div>

      <SearchForm
        action="/admin/early-access"
        defaultValue={q}
        placeholder="E-posta adresinde ara…"
      />

      {rows.length === 0 ? (
        <EmptyState
          title={q ? `"${q}" için sonuç bulunamadı.` : "Henüz hiç kayıt yok."}
          hint={
            q
              ? "Farklı bir arama dene veya filtreyi temizle."
              : "Ana sayfadaki erken erişim formundan gelen kayıtlar burada görünecek."
          }
        />
      ) : (
        <>
          <TablePanel>
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <Th>E-posta</Th>
                <Th>Kayıt Tarihi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <Tr key={record.id}>
                  <Td className="font-medium text-white">{record.email}</Td>
                  <Td className="text-xs text-muted">{formatDateTime(record.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </TablePanel>

          <Pagination
            basePath="/admin/early-access"
            filters={{ q: q || undefined }}
            page={page}
            pageCount={pageCount}
            total={total}
          />
        </>
      )}
    </div>
  );
}
