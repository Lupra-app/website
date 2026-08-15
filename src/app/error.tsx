"use client";

export default function GlobalRouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center"
    >
      <h1 className="font-heading text-3xl font-semibold text-white">Bir şeyler ters gitti</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Beklenmeyen bir hata oluştu. Tekrar denemek sorunu çözmezse birazdan yeniden ziyaret et.
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted/60">digest: {error.digest}</p>}
      <button
        type="button"
        onClick={retry}
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Tekrar dene
      </button>
    </main>
  );
}
