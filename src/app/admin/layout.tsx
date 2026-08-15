import { requireAdmin } from "@/lib/dal";
import { AdminBackground } from "./components/AdminBackground";
import { AdminSidebar } from "./components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Yetki kontrolü burada YAPILIYOR ama tek savunma hattı DEĞİL: layout
  // navigasyonda yeniden render olmayabilir ve server action'lar buradan hiç
  // geçmez. Her sayfa ve action requireAdmin()'i kendisi de çağırır.
  const session = await requireAdmin();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-bg text-white">
      <AdminBackground />

      <div className="flex min-h-screen">
        <AdminSidebar email={session.email} />

        {/* min-w-0: flex çocuğunun varsayılan min-width:auto değeri, taşan
            tabloların ana içeriği genişletmesine ve mobilde yatay kaydırmaya
            yol açıyordu. overflow-x-auto'nun çalışabilmesi buna bağlı. */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 md:px-8 md:pt-8">
            <div className="glass rounded-2xl border border-white/20 p-4 md:rounded-3xl md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
