import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminAllowed } from "@/config/admin";
import { Logo } from "@/components/Logo";
import { Logo3D } from "@/components/Logo3D";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  console.log("[AdminLayout] User:", user?.email || "null");

  if (!user) {
    console.log("[AdminLayout] No user, redirecting to /login");
    redirect("/login");
  }

  const isAllowed = await isAdminAllowed(user.email);
  console.log("[AdminLayout] isAdminAllowed:", isAllowed, "for", user.email);

  if (!isAllowed) {
    console.log("[AdminLayout] User not in allowlist, redirecting to /login");
    redirect("/login");
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-bg text-white">
      {/* Background: gradient + rotating 3D logo. `isolate` on the root keeps
          this -z-10 layer above the root background instead of behind it. */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-bg-raised" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(79, 70, 229, 0.14) 0%, transparent 55%)',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
          <Logo3D size={900} />
        </div>
        {/* Edge vignette for depth — keeps the logo visible in the center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.45) 100%)',
          }}
        />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar (glass) */}
        <aside className="sticky top-0 h-screen w-60 shrink-0 border-r border-white/10 bg-white/6 px-6 py-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light p-1">
              <Logo iconOnly size={20} />
            </div>
            <span className="font-heading text-lg font-semibold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              Lupra
            </span>
          </div>

          <nav className="space-y-2">
            <NavLink href="/admin" label="Kontrol Paneli" icon="📊" />
            <NavLink href="/admin/early-access" label="Erken Erişim" icon="📧" />
            <NavLink href="/admin/activity" label="Aktivite" icon="📜" />
          </nav>

          <div className="absolute bottom-8 left-6 right-6">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-xs backdrop-blur-xl transition-all hover:border-white/25">
              <p className="text-muted/80 text-xs truncate font-medium">{user.email}</p>
              <form action="/api/auth/logout" method="POST" className="mt-3">
                <button
                  type="submit"
                  className="text-accent-light hover:text-white transition-colors text-xs font-semibold"
                >
                  → Çıkış yap
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content (glass card over the rotating logo) */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8">
            <div className="rounded-3xl border border-white/10 bg-white/7 p-8 shadow-2xl backdrop-blur-2xl transition-colors duration-300 hover:border-white/20">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon?: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted transition-all hover:bg-white/12 hover:text-white border border-white/10 hover:border-white/25 backdrop-blur-sm hover:shadow-lg"
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </a>
  );
}
