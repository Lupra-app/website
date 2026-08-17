import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

/**
 * Profil bölümünün kabuğu.
 *
 * Buradaki requireUser() tek savunma hattı DEĞİL: layout navigasyonda yeniden
 * render olmayabilir ve server action'lar layout'tan hiç geçmez. Her sayfa ve
 * action yetkiyi kendisi de doğruluyor.
 */
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  const tabs = [
    { href: "/profil", label: "Profil" },
    { href: "/profil/siparisler", label: "Siparişler" },
    { href: "/profil/ayarlar", label: "Ayarlar" },
  ];

  return (
    <div className="min-h-screen bg-bg text-white">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {session.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */
              <img
                src={session.avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 font-heading text-xl text-muted">
                {(session.displayName ?? session.email).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-semibold text-white">
                {session.displayName ?? "Adsız kullanıcı"}
              </p>
              <p className="truncate text-sm text-muted">{session.email}</p>
            </div>
          </div>

          {session.isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/25"
            >
              Yönetim paneli
            </Link>
          )}
        </div>

        <nav className="mb-8 flex gap-2 border-b border-white/10">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm text-muted transition-colors hover:border-white/30 hover:text-white"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
