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
      {/* 3D Background Logo */}
      <div className="fixed inset-0 -z-10 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <Logo3D />
        </div>
      </div>

      {/* Glassmorphism Blur Effect */}
      <div className="fixed inset-0 -z-10 backdrop-blur-3xl" />

      <div className="flex min-h-screen text-white">
        {/* Sidebar */}
        <aside className="w-60 border-r border-white/10 bg-white/5 backdrop-blur-md sticky top-0 h-screen px-6 py-8">
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
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-xs hover:bg-white/15 transition-all">
            <p className="text-muted text-xs truncate">{user.email}</p>
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
        <div className="p-8 max-w-7xl">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-xl">
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
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted transition-all hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20 backdrop-blur-sm"
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </a>
  );
}
