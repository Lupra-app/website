import Link from "next/link";
import { Logo } from "./Logo";
import { getUserSession } from "@/lib/dal";

/**
 * Ana sayfa dışındaki herkese açık sayfaların (blog, proje, profil) üst barı.
 *
 * Ana sayfadaki Nav'dan ayrı: o, bölüm çapalarına (#how-it-works) kayan ve
 * kaydırmayla görünümü değişen bir client component. Buradaki sayfalarda o
 * çapalar yok, dolayısıyla bu bar sunucuda render edilen sade bir bileşen —
 * ve oturum durumunu doğrudan okuyabiliyor.
 */
export async function SiteHeader() {
  const session = await getUserSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label="Lupra ana sayfa">
          <Logo />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/urunler" className="text-muted transition-colors hover:text-white">
            Ürünler
          </Link>
          <Link href="/blog" className="text-muted transition-colors hover:text-white">
            Blog
          </Link>

          {session ? (
            <Link
              href="/profil"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 transition-colors hover:border-white/30"
            >
              {session.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */
                <img src={session.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-light">
                  {(session.displayName ?? session.email).charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-[8rem] truncate text-white">
                {session.displayName ?? "Profilim"}
              </span>
            </Link>
          ) : (
            <>
              <Link href="/giris" className="text-muted transition-colors hover:text-white">
                Giriş yap
              </Link>
              <Link
                href="/kayit"
                className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
              >
                Kayıt ol
              </Link>
            </>
          )}
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
