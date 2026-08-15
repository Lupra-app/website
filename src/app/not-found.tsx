import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
      <Logo />
      <p className="mt-10 font-heading text-6xl font-bold text-accent-light">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-white">Sayfa bulunamadı</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
