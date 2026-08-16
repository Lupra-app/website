import Link from "next/link";
import { Logo } from "./Logo";

/**
 * Ana sayfa dışındaki herkese açık sayfaların (blog, proje) üst barı.
 *
 * Ana sayfadaki Nav'dan ayrı: o, bölüm çapalarına (#how-it-works) kayan ve
 * kaydırmayla görünümü değişen bir client component. Buradaki sayfalarda o
 * çapalar yok, dolayısıyla bu bar sunucuda render edilen sade bir bileşen.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Lupra ana sayfa">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/blog" className="text-muted transition-colors hover:text-white">
            Blog
          </Link>
          <Link
            href="/#early-access"
            className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Erken erişim
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted">
        <span>© {new Date().getFullYear()} Lupra</span>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="transition-colors hover:text-white">
            Blog
          </Link>
          <a href="/blog/rss.xml" className="transition-colors hover:text-white">
            RSS
          </a>
          <Link href="/" className="transition-colors hover:text-white">
            lupra.app
          </Link>
        </div>
      </div>
    </footer>
  );
}
