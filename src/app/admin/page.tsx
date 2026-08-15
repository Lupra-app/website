import { getSupabaseServer } from "@/lib/supabase-server";

async function getStats() {
  try {
    const supabase = await getSupabaseServer();
    const { count: earlyAccessCount } = await supabase
      .from("early_access")
      .select("*", { count: "exact", head: true });

    return { earlyAccessCount: earlyAccessCount || 0 };
  } catch {
    return { earlyAccessCount: 0 };
  }
}

export const metadata = {
  title: "Admin | Kontrol Paneli",
};

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-heading text-4xl font-bold bg-gradient-to-r from-white via-white to-accent-light bg-clip-text text-transparent">
          Kontrol Paneli
        </h1>
        <p className="mt-3 text-sm text-muted/80">
          Lupra admin paneline hoşgeldiniz. Tüm verileriniz burada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Erken Erişim Kayıtları"
          value={stats.earlyAccessCount}
          href="/admin/early-access"
          icon="📧"
          color="from-blue-500"
        />
        <StatCard
          label="Aktivite Kaydı"
          value="→"
          href="/admin/activity"
          icon="📊"
          color="from-purple-500"
          subtitle="Son işlemler"
        />
        <StatCard
          label="Yakında"
          value="·"
          subtitle="Blog, grafik, CMS"
          disabled
          icon="🎯"
          color="from-gray-500"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  subtitle,
  disabled,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  href?: string;
  subtitle?: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}) {
  const content = (
    <div className={`group relative rounded-2xl border border-white/20 bg-gradient-to-br ${color || 'from-accent'} bg-opacity-5 backdrop-blur-md px-6 py-8 overflow-hidden transition-all hover:border-white/40 hover:bg-opacity-10 ${href && !disabled ? 'cursor-pointer' : ''}`}>
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted/90 uppercase tracking-wide">{label}</p>
          {icon && <span className="text-3xl opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>}
        </div>
        <p className="mt-4 font-heading text-5xl font-bold text-white">
          {value}
        </p>
        {subtitle && (
          <p className="mt-3 text-xs text-muted/70 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (href && !disabled) {
    return <a href={href} className="block">{content}</a>;
  }

  return <div className={disabled ? "opacity-40" : ""}>{content}</div>;
}
