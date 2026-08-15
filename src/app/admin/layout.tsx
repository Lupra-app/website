import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminAllowed } from "@/config/admin";
import { Logo } from "@/components/Logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminAllowed(user.email)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg text-white">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/10 bg-bg-raised/50 px-6 py-8">
        <div className="mb-12 flex items-center gap-3">
          <Logo iconOnly size={24} />
          <span className="font-heading text-lg font-semibold">Lupra</span>
        </div>

        <nav className="space-y-2">
          <NavLink href="/admin/early-access" label="Erken Erişim" />
          <NavLink href="/admin" label="Kontrol Paneli" />
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs">
            <p className="text-muted">{user.email}</p>
            <form action="/api/auth/logout" method="POST" className="mt-3">
              <button
                type="submit"
                className="text-accent hover:text-accent-light transition-colors"
              >
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded-lg px-4 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-white"
    >
      {label}
    </a>
  );
}
