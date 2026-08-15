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
      <h1 className="font-heading text-3xl font-semibold text-white">
        Kontrol Paneli
      </h1>
      <p className="mt-2 text-sm text-muted">Lupra admin paneline hoşgeldiniz.</p>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard
          label="Erken Erişim Kayıtları"
          value={stats.earlyAccessCount}
          href="/admin/early-access"
        />
        <StatCard
          label="Yakında"
          value="—"
          subtitle="Blog, grafik, CSV export"
          disabled
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
}: {
  label: string;
  value: string | number;
  href?: string;
  subtitle?: string;
  disabled?: boolean;
}) {
  const content = (
    <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-8 backdrop-blur-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-heading text-4xl font-semibold text-white">
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 text-xs text-muted">{subtitle}</p>
      )}
    </div>
  );

  if (href && !disabled) {
    return <a href={href} className="block hover:opacity-90 transition-opacity">{content}</a>;
  }

  return <div className={disabled ? "opacity-50" : ""}>{content}</div>;
}
