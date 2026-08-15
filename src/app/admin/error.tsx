"use client";

// Next.js 16'da hata bileşeninin prop'u `retry` — eski `reset` değil.
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="py-8 text-center">
      <h2 className="font-heading text-2xl font-semibold text-white">Bir şeyler ters gitti</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
        Veriler yüklenirken hata oluştu. Sorun sürerse Supabase bağlantısını ve tabloların
        oluşturulduğunu kontrol et.
      </p>

      <p className="mx-auto mt-4 max-w-lg break-words rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left font-mono text-xs text-red-300">
        {error.message}
        {error.digest && <span className="mt-1 block text-red-300/60">digest: {error.digest}</span>}
      </p>

      <button
        type="button"
        onClick={retry}
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Tekrar dene
      </button>
    </div>
  );
}
