import Link from "next/link";
import { requireUser } from "@/lib/dal";
import {
  formatAmount,
  getEarlyAccessStatus,
  getOrders,
  getProfile,
  getUserComments,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
} from "@/lib/profile-data";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Profilim | Lupra",
  robots: { index: false, follow: false },
};

const EARLY_ACCESS_LABELS: Record<string, string> = {
  new: "Listede",
  invited: "Davet edildi",
  joined: "Katıldı",
};

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted/80">{label}</p>
      <p className="mt-2 font-heading text-xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted/60">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const session = await requireUser();

  const [profile, orders, earlyAccess, comments] = await Promise.all([
    getProfile(session.userId),
    getOrders(session.userId, 3),
    getEarlyAccessStatus(session.email),
    getUserComments(session.email),
  ]);

  const paidTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          label="Üyelik"
          value={profile?.created_at ? formatDate(profile.created_at) : "—"}
          hint="Hesap açılış tarihi"
        />
        <Card
          label="Erken erişim"
          value={
            earlyAccess ? (EARLY_ACCESS_LABELS[earlyAccess.status] ?? earlyAccess.status) : "Listede değil"
          }
          hint={earlyAccess ? formatDate(earlyAccess.created_at) : "Ana sayfadan kaydolabilirsin"}
        />
        <Card
          label="Toplam ödeme"
          value={paidTotal > 0 ? formatAmount(paidTotal) : "—"}
          hint={orders.length > 0 ? `${orders.length} kayıt` : "Henüz ödeme yok"}
        />
      </div>

      <Section
        title="Hesap bilgileri"
        action={
          <Link
            href="/profil/ayarlar"
            className="text-sm font-semibold text-accent-light transition-colors hover:text-white"
          >
            Düzenle →
          </Link>
        }
      >
        <dl className="grid grid-cols-[9rem_1fr] gap-y-3 text-sm">
          <dt className="text-muted">Görünen ad</dt>
          <dd className="text-white">{profile?.display_name ?? "—"}</dd>
          <dt className="text-muted">E-posta</dt>
          <dd className="break-words text-white">{session.email}</dd>
          <dt className="text-muted">Hakkında</dt>
          <dd className="whitespace-pre-wrap text-white">{profile?.bio ?? "—"}</dd>
          <dt className="text-muted">Bülten</dt>
          <dd className="text-white">
            {profile?.newsletter_opt_in ? "Kayıtlı" : "Kayıtlı değil"}
          </dd>
        </dl>
      </Section>

      <Section
        title="Satın alma geçmişi"
        action={
          orders.length > 0 ? (
            <Link
              href="/profil/siparisler"
              className="text-sm font-semibold text-accent-light transition-colors hover:text-white"
            >
              Tümünü gör →
            </Link>
          ) : undefined
        }
      >
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center">
            <p className="text-sm text-white">Henüz bir satın alma yok.</p>
            <p className="mt-2 text-xs text-muted">
              Lupra erken erişim aşamasında; ödeme sistemi açıldığında faturaların ve
              aboneliğin burada görünecek.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{order.description}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted/70">
                    {order.order_number} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      ORDER_STATUS_BADGE[order.status] ?? ORDER_STATUS_BADGE.pending
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {formatAmount(order.amount_cents, order.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Yorumların">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">
            Henüz yorum bırakmadın. Blog yazılarına ya da{" "}
            <Link href="/#fikirler" className="text-accent-light hover:text-white">
              ana sayfadaki fikir duvarına
            </Link>{" "}
            yazabilirsin.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {comment.posts ? (
                    <Link
                      href={`/blog/${comment.posts.slug}`}
                      className="font-medium text-accent-light hover:text-white"
                    >
                      {comment.posts.title}
                    </Link>
                  ) : (
                    <Link href="/#fikirler" className="font-medium text-accent-light hover:text-white">
                      Fikir duvarı
                    </Link>
                  )}
                  <time className="text-muted/70">{formatDate(comment.created_at)}</time>
                  {comment.status === "pending" && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                      Onay bekliyor
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
