import Link from "next/link";
import { requireUser } from "@/lib/dal";
import {
  formatAmount,
  getOrders,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
} from "@/lib/profile-data";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Satın alma geçmişi | Lupra",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const session = await requireUser("/profil/siparisler");
  const orders = await getOrders(session.userId);

  const paidTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold text-white">Satın alma geçmişi</h1>
        <Link
          href="/profil"
          className="text-sm text-muted transition-colors hover:text-white"
        >
          ← Profile dön
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center">
          <p className="text-white">Henüz bir satın alma yok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Lupra şu an erken erişim aşamasında. Ödeme sistemi açıldığında faturaların,
            abonelik dönemlerin ve ödeme durumların burada listelenecek.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted/80">
              Toplam ödenen
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold text-white">
              {formatAmount(paidTotal)}
            </p>
            <p className="mt-1 text-xs text-muted/60">{orders.length} kayıt</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full min-w-lg text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-white/5">
                  <th scope="col" className="px-5 py-3 font-semibold text-muted">Sipariş</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-muted">Dönem</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-muted">Durum</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold text-muted">Tutar</th>
                  <th scope="col" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{order.description}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted/70">
                        {order.order_number} · {formatDate(order.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {order.period_start && order.period_end
                        ? `${formatDate(order.period_start)} – ${formatDate(order.period_end)}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          ORDER_STATUS_BADGE[order.status] ?? ORDER_STATUS_BADGE.pending
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-white">
                      {formatAmount(order.amount_cents, order.currency)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {order.invoice_url ? (
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-accent-light transition-colors hover:text-white"
                        >
                          Fatura ↗
                        </a>
                      ) : (
                        <span className="text-xs text-muted/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
