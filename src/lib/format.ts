/**
 * Tarih biçimlendirme — her zaman Europe/Istanbul.
 *
 * `timeZone` vermeden toLocaleDateString çağırmak sunucunun saat dilimini
 * kullanır. Vercel'de Node TZ=UTC olduğu için panel ve CSV'deki tüm saatler
 * 3 saat geride görünürdü; yerelde doğru göründüğü için de fark edilmesi zor
 * bir hataydı. Tüm biçimlendirme buradan geçer.
 */

const TZ = "Europe/Istanbul";

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}
