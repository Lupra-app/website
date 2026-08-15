import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="py-12 text-center">
      <p className="font-heading text-5xl font-bold text-accent-light">404</p>
      <h2 className="mt-4 font-heading text-2xl font-semibold text-white">Kayıt bulunamadı</h2>
      <p className="mt-3 text-sm text-muted">
        Aradığın kayıt silinmiş olabilir ya da adres yanlış.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Kontrol paneline dön
      </Link>
    </div>
  );
}
