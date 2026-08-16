"use client";

import { useActionState, useState } from "react";
import type { EarlyAccessRow as Row } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { DEVICE_LABELS, referrerLabel, type DeviceType } from "@/lib/user-agent";
import { updateEarlyAccessStatus } from "../actions";
import {
  EARLY_ACCESS_ERRORS,
  EMPTY_EARLY_ACCESS_STATE,
  STATUS_LABELS,
  statusBadge,
  statusLabel,
  type EarlyAccessStatusKey,
} from "../form-state";

/**
 * Bir kayıt satırı; tıklayınca altında tüm ayrıntılar ve durum formu açılır.
 *
 * Ayrı sayfa yerine genişleyen satır: listeyi kaybetmeden tek tek kayıtlara
 * bakıp davet durumunu işaretlemek, davet dalgası gönderirken yapılacak asıl iş.
 */
export function EarlyAccessRow({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateEarlyAccessStatus,
    EMPTY_EARLY_ACCESS_STATE
  );

  const source = row.utm_source ?? referrerLabel(row.source_referrer) ?? "Doğrudan";
  const device = row.device_type
    ? (DEVICE_LABELS[row.device_type as DeviceType] ?? row.device_type)
    : "—";

  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/8"
      >
        <td className="px-6 py-4">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`text-xs text-muted transition-transform ${open ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            <span className="font-medium text-white">{row.email}</span>
          </span>
        </td>
        <td className="px-6 py-4 text-xs text-muted">{source}</td>
        <td className="px-6 py-4 text-xs text-muted">{device}</td>
        <td className="px-6 py-4">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(row.status)}`}
          >
            {statusLabel(row.status)}
          </span>
        </td>
        <td className="px-6 py-4 text-xs text-muted">{formatDateTime(row.created_at)}</td>
      </tr>

      {open && (
        <tr className="border-b border-white/5 bg-white/5">
          <td colSpan={5} className="px-6 py-5">
            <div className="grid gap-6 md:grid-cols-2">
              <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-xs">
                <Detail label="E-posta" value={row.email} />
                <Detail label="Kayıt tarihi" value={formatDateTime(row.created_at)} />
                <Detail label="Geldiği site" value={row.source_referrer ?? "Doğrudan giriş"} />
                <Detail label="Kampanya kaynağı" value={row.utm_source} />
                <Detail label="Kampanya ortamı" value={row.utm_medium} />
                <Detail label="Kampanya adı" value={row.utm_campaign} />
                <Detail label="Cihaz" value={device} />
                <Detail label="Tarayıcı" value={row.browser} />
                <Detail label="İşletim sistemi" value={row.os} />
                <Detail label="Tarayıcı dili" value={row.language} />
                <Detail label="Ülke" value={row.country} />
                <Detail
                  label="Durum değişikliği"
                  value={row.status_updated_at ? formatDateTime(row.status_updated_at) : null}
                />
              </dl>

              <form action={formAction} className="space-y-3">
                <input type="hidden" name="id" value={row.id} />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Durum</span>
                  <select
                    name="status"
                    defaultValue={row.status}
                    className="w-full rounded-lg border border-white/10 bg-bg-raised px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                  >
                    {(Object.keys(STATUS_LABELS) as EarlyAccessStatusKey[]).map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">
                    Not <span className="text-muted/60">— sadece panelde görünür</span>
                  </span>
                  <textarea
                    name="note"
                    rows={3}
                    maxLength={1000}
                    defaultValue={row.note ?? ""}
                    placeholder="Ör. 12 Ağustos dalgasında davet edildi"
                    className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-muted/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={pending}
                    aria-busy={pending}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                  {state.saved && !state.error && (
                    <span role="status" className="text-xs text-emerald-300">
                      Kaydedildi
                    </span>
                  )}
                  {state.error && (
                    <span role="alert" className="text-xs text-red-300">
                      {EARLY_ACCESS_ERRORS[state.error] ?? EARLY_ACCESS_ERRORS.server_error}
                    </span>
                  )}
                </div>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-muted/70">{label}</dt>
      <dd className="break-words text-white">{value || <span className="text-muted/40">—</span>}</dd>
    </>
  );
}
