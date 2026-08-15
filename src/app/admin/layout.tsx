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
    <div className="relative min-h-screen bg-gradient-to-br from-bg via-bg to-bg-raised overflow-hidden">
      {/* Base Background */}
      <div className="fixed inset-0 -z-50 bg-black/30" />

      {/* 3D Background Logo - Very Small, Corner */}
      <div className="fixed bottom-0 right-0 -z-40 opacity-3 pointer-events-none overflow-hidden">
        <div className="w-96 h-96 blur-3xl">
          <Logo3D />
        </div>
      </div>

      {/* Very Strong Glassmorphism Blur Effect */}
      <div className="fixed inset-0 -z-30 backdrop-blur-3xl bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      <div className="relative z-10 flex min-h-screen text-white">
        {/* Sidebar */}
        <aside className="w-60 border-r border-white/30 bg-white/8 backdrop-blur-xl sticky top-0 h-screen px-6 py-8 shadow-2xl">
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
          <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl px-4 py-3 text-xs hover:from-white/25 hover:to-white/15 hover:border-white/40 transition-all shadow-lg">
            <p className="text-muted/90 text-xs truncate font-medium">{user.email}</p>
            <form action="/api/auth/logout" method="POST" className="mt-3">
              <button
                type="submit"
                className="text-accent hover:text-accent-light transition-colors text-xs font-semibold"
              >
                → Çıkış yap
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="rounded-3xl border-2 border-white/40 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-3xl p-8 shadow-2xl hover:border-white/60 transition-all duration-300 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-t before:from-accent/5 before:to-transparent before:pointer-events-none relative">
            <div className="relative z-10">
              {children}
            </div>
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
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted transition-all hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20 backdrop-blur-sm"
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </a>
  );
}
