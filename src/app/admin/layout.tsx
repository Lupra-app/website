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
      <div className="fixed inset-0 bg-black/40" style={{ zIndex: -50 }} />

      {/* 3D Animated Background Logo */}
      <div className="fixed -top-48 -right-64 opacity-20 pointer-events-none" style={{ zIndex: -40 }}>
        <Logo3D size={1200} />
      </div>

      {/* Premium Glassmorphism Blur Effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -35,
          backdropFilter: 'blur(60px) saturate(1.5)',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: -32,
          background: 'radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0.4) 60%)'
        }}
      />

      <div className="relative z-10 flex min-h-screen text-white">
        {/* Sidebar */}
        <aside className="w-60 border-r border-white/20 bg-white/7 backdrop-blur-2xl sticky top-0 h-screen px-6 py-8 shadow-2xl">
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
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-4 py-3 text-xs hover:border-white/40 transition-all shadow-lg hover:shadow-xl">
            <p className="text-muted/80 text-xs truncate font-medium">{user.email}</p>
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
          <div className="rounded-3xl border border-white/30 bg-white/12 backdrop-blur-2xl p-8 shadow-2xl hover:border-white/50 transition-all duration-300 relative overflow-hidden group">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 0 }}>
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>
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
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted transition-all hover:bg-white/12 hover:text-white border border-white/10 hover:border-white/25 backdrop-blur-sm hover:shadow-lg"
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </a>
  );
}
