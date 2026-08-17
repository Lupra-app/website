import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getProfile } from "@/lib/profile-data";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Profilim | Lupra",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requireUser();
  const profile = await getProfile(session.userId);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-heading text-lg font-semibold text-white">Hesap bilgileri</h2>
        <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-3 text-sm">
          <dt className="text-muted">Görünen ad</dt>
          <dd className="text-white">{profile?.display_name ?? "—"}</dd>
          <dt className="text-muted">E-posta</dt>
          <dd className="text-white">{session.email}</dd>
          <dt className="text-muted">Hakkında</dt>
          <dd className="whitespace-pre-wrap text-white">{profile?.bio ?? "—"}</dd>
          <dt className="text-muted">Bülten</dt>
          <dd className="text-white">
            {profile?.newsletter_opt_in ? "Kayıtlı" : "Kayıtlı değil"}
          </dd>
          <dt className="text-muted">Üyelik</dt>
          <dd className="text-white">
            {profile?.created_at ? formatDate(profile.created_at) : "—"}
          </dd>
        </dl>

        <Link
          href="/profil/ayarlar"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ayarları düzenle
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-heading text-lg font-semibold text-white">Lupra&apos;da neredesin</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Lupra şu an erken erişim aşamasında. Ürün açıldığında agent&apos;larını buradan
          yöneteceksin; şimdilik hesabın hazır ve gelişmelerden ilk sen haberdar olacaksın.
        </p>
        <Link
          href="/blog"
          className="mt-4 inline-block text-sm font-semibold text-accent-light transition-colors hover:text-white"
        >
          Blog&apos;u oku →
        </Link>
      </section>
    </div>
  );
}
