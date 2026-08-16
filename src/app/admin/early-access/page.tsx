import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getEarlyAccessStats, listEarlyAccess } from "@/lib/admin-data";
import { DEFAULT_PAGE_SIZE, parsePage, parseQuery } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchForm } from "../components/SearchForm";
import { EmptyState, TablePanel, Th } from "../components/AdminTable";
import { EarlyAccessRow } from "./components/EarlyAccessRow";
import { STATUS_LABELS, type EarlyAccessStatusKey } from "./form-state";

export const metadata = {
  title: "Erken Erişim | Admin",
};

const STATUS_FILTERS: { value: EarlyAccessStatusKey | undefined; label: string }[] = [
  { value: undefined, label: "Tümü" },
  { value: "new", label: STATUS_LABELS.new },
  { value: "invited", label: STATUS_LABELS.invited },
  { value: "joined", label: STATUS_LABELS.joined },
];

function parseStatusFilter(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "new" || v === "invited" || v === "joined" ? v : undefined;
}

export default async function EarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);
  const status = parseStatusFilter(sp.status);

  const [stats, { rows, total, pageCount }] = await Promise.all([
    getEarlyAccessStats(),
    listEarlyAccess({ page, pageSize: DEFAULT_PAGE_SIZE, q: q || undefined, status }),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">
            Erken Erişim Kayıtları
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ana sayfadaki formdan kaydolan herkes, nereden geldiğiyle birlikte burada.
          </p>
        </div>
        {stats.total > 0 && (
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

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Toplam kayıt" value={stats.total} />
        <StatTile label="Bugün" value={stats.today} />
        <StatTile label="Son 7 gün" value={stats.week} />
        <StatTile
          label="En çok getiren"
          value={stats.topSource?.name ?? "—"}
          hint={stats.topSource ? `${stats.topSource.count} kayıt` : undefined}
          small
        />
      </div>

      <SearchForm
        action="/admin/early-access"
        defaultValue={q}
        placeholder="E-posta adresinde ara…"
        hidden={{ status }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (filter.value) params.set("status", filter.value);
          const href = params.toString()
            ? `/admin/early-access?${params}`
            : "/admin/early-access";

          const count =
            filter.value === "invited"
              ? stats.invited
              : filter.value === "joined"
                ? stats.joined
                : filter.value === "new"
                  ? stats.total - stats.invited - stats.joined
                  : stats.total;

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
              {filter.label} <span className="text-muted/60">{count}</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            q || status ? "Bu filtreye uyan kayıt yok." : "Henüz hiç kayıt yok."
          }
          hint={
            q || status
              ? "Filtreyi değiştir veya temizle."
              : "Ana sayfadaki erken erişim formundan gelen kayıtlar burada görünecek."
          }
        />
      ) : (
        <>
          <TablePanel>
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <Th>E-posta</Th>
                <Th>Kaynak</Th>
                <Th>Cihaz</Th>
                <Th>Durum</Th>
                <Th>Kayıt Tarihi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <EarlyAccessRow key={row.id} row={row} />
              ))}
            </tbody>
          </TablePanel>

          <p className="mt-3 text-xs text-muted/60">
            Ayrıntıları görmek ve davet durumunu işaretlemek için bir satıra tıkla.
          </p>

          <Pagination
            basePath="/admin/early-access"
            filters={{ q: q || undefined, status }}
            page={page}
            pageCount={pageCount}
            total={total}
          />
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  small,
}: {
  label: string;
  value: string | number;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div className="glass rounded-2xl border border-white/15 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted/80">{label}</p>
      <p
        className={`mt-2 font-heading font-bold text-white ${small ? "truncate text-xl" : "text-3xl"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted/60">{hint}</p>}
    </div>
  );
}
