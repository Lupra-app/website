import Link from "next/link";

/**
 * Sunucu tarafı arama. Eskiden erken erişim tablosunda client-side useMemo
 * filtresi vardı; sayfalamayla birlikte bu yanlış olurdu (yalnızca görünen
 * 25 satırı filtreler). Düz bir GET formu hem tüm tabloyu kapsar hem de
 * JS gerektirmez.
 */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  hidden = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  /** Aramayla birlikte korunacak diğer filtreler (ör. durum). */
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form method="GET" action={action} className="mb-6 flex flex-wrap items-center gap-3">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null
      )}

      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Ara
      </button>
      {defaultValue && (
        <Link
          href={action}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted transition-colors hover:text-white"
        >
          Temizle
        </Link>
      )}
    </form>
  );
}
