/** Liste sayfalarının ortak sayfalama yardımcıları (searchParams tabanlı). */

export const DEFAULT_PAGE_SIZE = 25;

type Param = string | string[] | undefined;

function first(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `?page=abc`, `?page=-3`, `?page=` gibi girdilerin hepsi 1'e düşer. */
export function parsePage(value: Param): number {
  const parsed = Number.parseInt(first(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseQuery(value: Param): string {
  return (first(value) ?? "").trim().slice(0, 100);
}

export function parseStatus(value: Param): "draft" | "published" | undefined {
  const v = first(value);
  return v === "draft" || v === "published" ? v : undefined;
}

/** Supabase `.range()` için [from, to] — ikisi de dahil (inclusive). */
export function toRange(page: number, pageSize: number): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Mevcut filtreleri (arama, durum) koruyarak sayfa numarasını değiştirir. */
export function pageHref(
  basePath: string,
  current: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  else params.delete("page");

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
