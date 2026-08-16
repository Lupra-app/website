import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getBlogStats, getDashboardStats } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Admin | Kontrol Paneli",
};

export default async function AdminPage() {
  await requireAdmin();
  const [stats, blog] = await Promise.all([getDashboardStats(), getBlogStats()]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-white via-white to-accent-light bg-clip-text text-transparent md:text-4xl">
          Kontrol Paneli
        </h1>
        <p className="mt-3 text-sm text-muted/80">
          Lupra admin paneline hoşgeldiniz. Tüm verileriniz burada.
        </p>
      </div>

      {blog.tablesMissing && (
        <div
          role="alert"
          className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
        >
          <strong className="font-semibold">Blog tabloları henüz oluşturulmamış.</strong>{" "}
          Supabase → SQL Editor&apos;da <code className="font-mono">supabase/schema.sql</code>{" "}
          dosyasındaki <code className="font-mono">posts</code> ve{" "}
          <code className="font-mono">comments</code> bölümünü çalıştır.
        </div>
      )}

      {stats.projectsTableMissing && (
        <div
          role="alert"
          className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
        >
          <strong className="font-semibold">Projeler tablosu henüz oluşturulmamış.</strong>{" "}
          Supabase → SQL Editor&apos;da <code className="font-mono">supabase/schema.sql</code>{" "}
          dosyasındaki <code className="font-mono">projects</code> bölümünü çalıştır.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Erken Erişim Kayıtları"
          value={stats.earlyAccessCount}
          href="/admin/early-access"
          icon="📧"
          color="blue"
          subtitle="Toplam kayıt"
        />
        <StatCard
          label="Projeler"
          value={stats.projectCount}
          href="/admin/projects"
          icon="📁"
          color="indigo"
          subtitle={`${stats.publishedCount} yayında`}
        />
        <StatCard
          label="Aktivite Kaydı"
          value={stats.auditCount}
          href="/admin/activity"
          icon="📜"
          color="purple"
          subtitle={
            stats.lastActivityAt ? `Son işlem: ${formatDateTime(stats.lastActivityAt)}` : "Henüz işlem yok"
          }
        />
        <StatCard
          label="Blog Yazıları"
          value={blog.posts}
          href="/admin/blog"
          icon="✍️"
          color="indigo"
          subtitle={`${blog.published} yayında`}
        />
        <StatCard
          label="Yorumlar"
          value={blog.pendingComments > 0 ? `${blog.pendingComments} bekliyor` : blog.approvedComments}
          href="/admin/comments"
          icon="💬"
          color={blog.pendingComments > 0 ? "amber" : "purple"}
          subtitle={
            blog.pendingComments > 0
              ? "Onaylanmadan görünmüyorlar"
              : `${blog.approvedComments} onaylı yorum`
          }
        />
        <StatCard
          label="Yöneticiler"
          value={stats.adminCount}
          href="/admin/admins"
          icon="👤"
          color="emerald"
          subtitle="Panele erişebilen kişi"
        />
      </div>
    </div>
  );
}

const COLOR_STYLES = {
  blue: { border: "border-blue-400/30 hover:border-blue-400/60", tint: "from-blue-500/15" },
  purple: { border: "border-purple-400/30 hover:border-purple-400/60", tint: "from-purple-500/15" },
  indigo: { border: "border-indigo-400/30 hover:border-indigo-400/60", tint: "from-indigo-500/15" },
  emerald: { border: "border-emerald-400/30 hover:border-emerald-400/60", tint: "from-emerald-500/15" },
  // Bekleyen yorum varsa kart dikkat çeksin diye.
  amber: { border: "border-amber-400/40 hover:border-amber-400/70", tint: "from-amber-500/15" },
} as const;

function StatCard({
  label,
  value,
  href,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  href: string;
  subtitle?: string;
  icon: string;
  color: keyof typeof COLOR_STYLES;
}) {
  const { border, tint } = COLOR_STYLES[color];

  return (
    <Link href={href} className="block">
      <div
        className={`glass group relative overflow-hidden rounded-3xl border ${border} px-6 py-8 transition-colors`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${tint} to-transparent`} />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted/90">{label}</p>
            <span aria-hidden="true" className="text-3xl opacity-80 transition-opacity group-hover:opacity-100">
              {icon}
            </span>
          </div>
          <p className="mt-4 font-heading text-5xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-3 text-xs font-medium text-muted/70">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );
}
