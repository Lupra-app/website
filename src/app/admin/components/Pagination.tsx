import Link from "next/link";
import { pageHref } from "@/lib/pagination";

/**
 * Sayfalama şeridi. Server component — sayfa numarası URL'de tutuluyor,
 * böylece bağlantı paylaşılabilir ve geri tuşu doğru çalışır.
 */
export function Pagination({
  basePath,
  filters,
  page,
  pageCount,
  total,
  label = "kayıt",
}: {
  basePath: string;
  /** Sayfa değişirken korunacak diğer sorgu parametreleri (arama, durum). */
  filters: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  label?: string;
}) {
  if (total === 0) return null;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;
  const linkClass =
    "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 transition-colors hover:border-white/30 hover:text-white";
  const disabledClass =
    "cursor-not-allowed rounded-lg border border-white/5 px-3 py-1.5 text-muted/40";

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted"
    >
      <span>
        Toplam <strong className="text-white">{total}</strong> {label} · Sayfa {page} / {pageCount}
      </span>

      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={pageHref(basePath, filters, page - 1)} className={linkClass}>
            ← Önceki
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            ← Önceki
          </span>
        )}

        {hasNext ? (
          <Link href={pageHref(basePath, filters, page + 1)} className={linkClass}>
            Sonraki →
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Sonraki →
          </span>
        )}
      </div>
    </nav>
  );
}
